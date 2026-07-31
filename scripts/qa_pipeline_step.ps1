param(
  [int]$IterationNumber = 0,
  [int]$BatchSize = 20,
  [int]$MaxBooking = 4,
  [int]$Batch3WaitSec = 2,
  [int]$BookingDelaySec = 8,
  [int]$ResultsPollSec = 15,
  [int]$ResultsTimeoutSec = 240,
  [float]$MinResultsPct = 0.80,
  [string]$SinceKey = '',
  [switch]$DryRun
)

$ErrorActionPreference = 'Continue'
Set-StrictMode -Off

function Load-Env {
  $path = Join-Path (Split-Path $PSScriptRoot) ".env"
  Get-Content $path | ForEach-Object {
    $l = $_.Trim()
    if ($l -and -not $l.StartsWith('#') -and $l.Contains('=')) {
      $idx = $l.IndexOf('=')
      $k = $l.Substring(0,$idx).Trim()
      $v = $l.Substring($idx+1).Trim()
      [Environment]::SetEnvironmentVariable($k, $v)
    }
  }
}

function Safe([object]$v, [string]$def='') {
  if ($null -eq $v -or "$v" -eq '') { return $def }
  return "$v"
}

function Invoke-Psql([string]$sql, [switch]$Tuples) {
  if ($Tuples) {
    & psql $env:SUPABASE_DB_URL -t -A -c $sql 2>&1
  } else {
    & psql $env:SUPABASE_DB_URL -c $sql 2>&1
  }
}

function Get-PsqlRows([string]$sql) {
  $raw = Invoke-Psql $sql -Tuples
  $raw | Where-Object { $_ -match '\S' -and $_ -notmatch '^\(' }
}

function Log([string]$msg, [string]$lvl='INFO') {
  $ts = (Get-Date).ToString('HH:mm:ss')
  Write-Host "[$ts][$lvl] $msg"
}

function Get-LastIterNum {
  $r = Get-PsqlRows "SELECT COALESCE(MAX(iteration),0) FROM qa_pipeline_runs;"
  return [int](Safe ($r | Select-Object -First 1) '0')
}

function Get-IterRecord([int]$n) {
  $r = Get-PsqlRows "SELECT iteration,status,array_length(scenario_keys,1),COALESCE(pass_count,0),COALESCE(fail_count,0) FROM qa_pipeline_runs WHERE iteration=$n;"
  if (-not $r) { return $null }
  $p = ($r | Select-Object -First 1).Split('|')
  return @{
    N      = [int]$p[0]
    Status = $p[1].Trim()
    ScCt   = [int]$p[2]
    Pass   = [int]$p[3]
    Fail   = [int]$p[4]
  }
}

function Get-IterKeys([int]$n) {
  $rows = Get-PsqlRows "SELECT unnest(scenario_keys) FROM qa_pipeline_runs WHERE iteration=$n;"
  return $rows | ForEach-Object { $_.Trim() } | Where-Object { $_ -match '\S' }
}

function Set-Status([int]$n, [string]$s, [string]$notes='') {
  if ($notes) {
    $safeNotes = $notes -replace "'","''"
    Invoke-Psql "UPDATE qa_pipeline_runs SET status='$s',notes='$safeNotes',updated_at=now() WHERE iteration=$n;" | Out-Null
  } else {
    Invoke-Psql "UPDATE qa_pipeline_runs SET status='$s',updated_at=now() WHERE iteration=$n;" | Out-Null
  }
}

function Set-Results([int]$n,[int]$pass,[int]$fail,[int]$err) {
  Invoke-Psql "UPDATE qa_pipeline_runs SET pass_count=$pass,fail_count=$fail,error_count=$err,status='evaluated',updated_at=now() WHERE iteration=$n;" | Out-Null
}

function Get-NextScenarios([int]$count, [int]$maxBk) {
  $used = Get-PsqlRows "SELECT unnest(scenario_keys) FROM qa_pipeline_runs;"
  $usedSql = ''
  if ($used -and $used.Count -gt 0) {
    $usedClean = $used | Where-Object { $_ -match '\S' } | ForEach-Object { $_.Trim() }
    if ($usedClean.Count -gt 0) {
      $list = ($usedClean | ForEach-Object { "'$_'" }) -join ','
      $usedSql = "AND scenario_key NOT IN ($list)"
    }
  }
  $keyFilter = if ($SinceKey) { "AND scenario_key >= '$SinceKey'" } else { "" }

  $bkKeys = @(Get-PsqlRows "SELECT scenario_key FROM qa_test_scenarios_temp WHERE enabled=true AND jsonb_array_length(steps)>=4 $keyFilter $usedSql ORDER BY scenario_key LIMIT $maxBk;")
  $faqCt  = $count - $bkKeys.Count
  $faqKeys = @(Get-PsqlRows "SELECT scenario_key FROM qa_test_scenarios_temp WHERE enabled=true AND jsonb_array_length(steps) BETWEEN 1 AND 3 $keyFilter $usedSql ORDER BY scenario_key LIMIT $faqCt;")

  $all = (@($faqKeys) + @($bkKeys)) | Where-Object { $_ -match '\S' } | ForEach-Object { $_.Trim() }
  return $all
}

function Register-Iter([int]$n, [string[]]$keys) {
  $arr = ($keys | ForEach-Object { "'$_'" }) -join ','
  Invoke-Psql "INSERT INTO qa_pipeline_runs(iteration,scenario_keys,status) VALUES($n,ARRAY[$arr],'pending') ON CONFLICT(iteration) DO NOTHING;" | Out-Null
}

function Clear-GCal([string[]]$bkKeys) {
  if (-not $bkKeys -or $bkKeys.Count -eq 0) { return }
  Invoke-Psql @"
UPDATE appointments
SET status='cancelled', cancelled_at=now()
WHERE status IN ('confirmed','booked_pending')
  AND conversation_id IN (
    SELECT DISTINCT m.lead_id FROM messages m
    WHERE m.created_at > NOW()-INTERVAL '3 hours'
  );
"@ | Out-Null
  Log "GCal slots cleared for $($bkKeys.Count) booking scenarios"
}

function Dispatch-Iter([int]$n, [string[]]$keys) {
  Set-Status $n 'dispatching'
  # Set dispatched_at BEFORE sending scenarios so results anchor includes early results
  Invoke-Psql "UPDATE qa_pipeline_runs SET dispatched_at=now()-INTERVAL '30 seconds' WHERE iteration=$n;" | Out-Null
  $url  = $env:N8N_QA_RUNNER_WEBHOOK_URL
  $sent = 0
  $fail = 0

  $bkKeys  = @()
  $faqKeys = @()
  foreach ($k in $keys) {
    $sc = [int](Safe (Get-PsqlRows "SELECT jsonb_array_length(steps) FROM qa_test_scenarios_temp WHERE scenario_key='$k';" | Select-Object -First 1) '1')
    if ($sc -ge 4) { $bkKeys += $k } else { $faqKeys += $k }
  }

  Log "  Booking=$($bkKeys.Count) FAQ=$($faqKeys.Count)"

  foreach ($k in $bkKeys) {
    if ($DryRun) {
      Log "  [DRY] booking $k"
      $sent++
      Start-Sleep -Milliseconds 500
      continue
    }
    try {
      $body = @{use_temp=$true;temp_prefix='56990';scenario_key=$k} | ConvertTo-Json
      Invoke-RestMethod -Method Post -Uri $url -Body $body -ContentType 'application/json' -TimeoutSec 15 | Out-Null
      $sent++
      Log "  Booking: $k"
    } catch {
      $fail++
      Log "  FAIL booking $k" 'WARN'
    }
    Start-Sleep -Seconds $BookingDelaySec
  }

  for ($i = 0; $i -lt $faqKeys.Count; $i += 3) {
    $grp = $faqKeys[$i..([Math]::Min($i+2, $faqKeys.Count-1))]
    if ($DryRun) {
      $grp | ForEach-Object { Log "  [DRY] faq $_" }
      $sent += $grp.Count
    } else {
      $jobs = $grp | ForEach-Object {
        $k = $_
        Start-Job -ScriptBlock {
          param($u,$k2)
          try {
            $b = @{use_temp=$true;temp_prefix='56990';scenario_key=$k2} | ConvertTo-Json
            Invoke-RestMethod -Method Post -Uri $u -Body $b -ContentType 'application/json' -TimeoutSec 15 | Out-Null
          } catch {}
        } -ArgumentList $url,$k
      }
      $jobs | Wait-Job | Remove-Job
      $sent += $grp.Count
    }
    if (($i+3) -lt $faqKeys.Count) { Start-Sleep -Seconds $Batch3WaitSec }
  }

  Invoke-Psql "UPDATE qa_pipeline_runs SET status='running' WHERE iteration=$n;" | Out-Null
  Log "Dispatched $sent/$($keys.Count) for iter $n"
  return @{Sent=$sent;Failed=$fail}
}

function Wait-Results([int]$n, [string[]]$keys) {
  $total   = $keys.Count
  $keyList = ($keys | ForEach-Object { "'$($_.Trim())'" }) -join ','
  # Use the dispatch time from DB as anchor — avoids counting old runs of same scenario
  $dispatchedAt = (Get-PsqlRows "SELECT COALESCE(to_char(dispatched_at,'YYYY-MM-DD HH24:MI:SS'), to_char(now()-INTERVAL '5 minutes','YYYY-MM-DD HH24:MI:SS')) FROM qa_pipeline_runs WHERE iteration=$n;" | Select-Object -First 1).Trim()
  $until   = (Get-Date).AddSeconds($ResultsTimeoutSec)
  $lastPct = -1

  while ((Get-Date) -lt $until) {
    $row = Get-PsqlRows @"
SELECT
  count(*) FILTER(WHERE llm_passed IS NOT NULL),
  count(*) FILTER(WHERE llm_passed=true),
  count(*) FILTER(WHERE llm_passed=false)
FROM qa_test_results
WHERE scenario_id=ANY(ARRAY[$keyList])
  AND created_at >= '$dispatchedAt'::timestamptz;
"@
    $p    = ($row | Select-Object -First 1).Split('|')
    $done = [int]$p[0]
    $pass = [int]$p[1]
    $fail = [int]$p[2]
    $pct  = if ($total -gt 0) { [math]::Round($done/$total, 2) } else { 0 }

    if ($pct -ne $lastPct) {
      Log "  Iter $n results: $done/$total ($([int]($pct*100))%) pass=$pass fail=$fail"
      $lastPct = $pct
    }
    if ($done -ge $total -or $pct -ge $MinResultsPct) {
      return @{Done=$done;Pass=$pass;Fail=$fail;Pct=$pct;Complete=($done -ge $total)}
    }
    Start-Sleep -Seconds $ResultsPollSec
  }

  $row = Get-PsqlRows @"
SELECT
  count(*) FILTER(WHERE llm_passed IS NOT NULL),
  count(*) FILTER(WHERE llm_passed=true),
  count(*) FILTER(WHERE llm_passed=false)
FROM qa_test_results
WHERE scenario_id=ANY(ARRAY[$keyList])
  AND created_at >= '$dispatchedAt'::timestamptz;
"@
  $p = ($row | Select-Object -First 1).Split('|')
  return @{Done=[int]$p[0];Pass=[int]$p[1];Fail=[int]$p[2];Pct=0;Complete=$false;TimedOut=$true}
}

function Get-Failures([int]$n, [string[]]$keys) {
  $keyList = ($keys | ForEach-Object { "'$($_.Trim())'" }) -join ','
  $dispatchedAt = (Get-PsqlRows "SELECT COALESCE(to_char(dispatched_at,'YYYY-MM-DD HH24:MI:SS'), to_char(now()-INTERVAL '5 minutes','YYYY-MM-DD HH24:MI:SS')) FROM qa_pipeline_runs WHERE iteration=$n;" | Select-Object -First 1).Trim()
  # Deduplicate: one failure per scenario_id (latest result since dispatch)
  $rows = Get-PsqlRows @"
SELECT DISTINCT ON (r.scenario_id) r.scenario_id, LEFT(r.llm_notes,200)
FROM qa_test_results r
WHERE r.scenario_id=ANY(ARRAY[$keyList])
  AND r.llm_passed=false
  AND r.llm_notes NOT LIKE '%No se pudo interpretar%'
  AND r.created_at >= '$dispatchedAt'::timestamptz
ORDER BY r.scenario_id, r.created_at DESC;
"@
  $bugs = @()
  foreach ($row in $rows) {
    $p = $row.Split('|')
    if ($p.Count -lt 2) { continue }
    $bugs += @{ScenarioId=$p[0].Trim(); Notes=$p[1].Trim()}
  }
  return $bugs
}

# ======================== MAIN ========================
Load-Env

if ($IterationNumber -le 0) {
  $IterationNumber = (Get-LastIterNum) + 1
}
$prevN = $IterationNumber - 1

Log "=== PIPELINE STEP $IterationNumber (prev=$prevN) ==="

$summary = [ordered]@{
  Iteration     = $IterationNumber
  PrevIteration = $prevN
  Dispatch      = $null
  Evaluate      = $null
  Failures      = @()
  NextIteration = ($IterationNumber + 1)
  Timestamp     = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
}

# === A: Dispatch current iteration ===
$cur = Get-IterRecord $IterationNumber
if (-not $cur -or $cur.Status -eq 'pending') {
  Log "Selecting $BatchSize scenarios for iter ${IterationNumber}..."
  $keys = @(Get-NextScenarios $BatchSize $MaxBooking)

  if ($keys.Count -eq 0) {
    Log "NO ENABLED SCENARIOS LEFT" 'ERROR'
    $summary.Dispatch = @{Error='no_scenarios'}
    $summary | ConvertTo-Json -Depth 5
    exit 1
  }

  $keyList2 = ($keys | ForEach-Object { "'$_'" }) -join ','
  $bkKeys2  = @(Get-PsqlRows "SELECT scenario_key FROM qa_test_scenarios_temp WHERE scenario_key IN ($keyList2) AND jsonb_array_length(steps)>=4;")
  if ($bkKeys2.Count -gt 0) { Clear-GCal $bkKeys2 }

  Register-Iter $IterationNumber $keys
  Log "Registered iter ${IterationNumber}: $($keys.Count) scenarios ($($bkKeys2.Count) booking)"
}

$curKeys = @(Get-IterKeys $IterationNumber)
Log "Dispatching $($curKeys.Count) scenarios for iter ${IterationNumber}..."
$summary.Dispatch = Dispatch-Iter $IterationNumber $curKeys

# === B: Evaluate previous iteration (overlaps with current running) ===
if ($prevN -ge 1) {
  $prev = Get-IterRecord $prevN
  $evalStatuses = @('running','dispatching','evaluating')
  if ($prev -and $evalStatuses -contains $prev.Status) {
    Log "Evaluating iter ${prevN} (status=$($prev.Status))..."
    Set-Status $prevN 'evaluating'
    $prevKeys = @(Get-IterKeys $prevN)

    if ($prevKeys.Count -gt 0) {
      $res = Wait-Results $prevN $prevKeys
      Set-Results $prevN $res.Pass $res.Fail ($prevKeys.Count - $res.Done)
      $summary.Evaluate = $res

      $bugs = @(Get-Failures $prevN $prevKeys)
      $summary.Failures = $bugs

      $bugNote = "pass=$($res.Pass) fail=$($res.Fail) bugs=$($bugs.Count)"
      Set-Status $prevN 'done' $bugNote

      if ($bugs.Count -gt 0) {
        Log "Iter ${prevN}: $($bugs.Count) failures" 'WARN'
        $bugs | Select-Object -First 5 | ForEach-Object {
          $short = if ($_.Notes.Length -gt 120) { $_.Notes.Substring(0,120) } else { $_.Notes }
          Log "  [$($_.ScenarioId)] $short" 'WARN'
        }
      } else {
        Log "Iter ${prevN}: CLEAN ($($res.Pass) passed)"
      }
    }
  } elseif ($prev) {
    Log "Iter ${prevN} already status=$($prev.Status) -- skip eval"
  }
}

Log "=== DONE: iter ${IterationNumber} dispatched. Eval complete for iter ${prevN} ==="
$summary | ConvertTo-Json -Depth 5
