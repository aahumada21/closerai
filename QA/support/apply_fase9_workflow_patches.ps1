$ErrorActionPreference = 'Stop'

$wf90Path = "workflows/exports/uncategorized/9.0 - 9.0 qa_whatsapp_normalized_router__id-1badeb35-0335-4aaa-96a6-2e021376db8a.json"
$wf911Path = "workflows/exports/uncategorized/9.1 - 9.1.1 qa_run_single_conversation__id-34092303-cb4a-4fd2-800e-ac16f650fc52.json"

$wf90 = Get-Content $wf90Path -Raw | ConvertFrom-Json
($wf90.nodes | Where-Object { $_.name -eq 'build_commercial_payload' }).parameters.jsCode = Get-Content 'QA/support/fase9_9_0_build_commercial_payload.js' -Raw

if (-not ($wf90.nodes | Where-Object { $_.name -eq 'resolve_agent_channel_for_qa' })) {
  $wf90.nodes += [pscustomobject]@{
    parameters = [pscustomobject]@{
      operation = 'executeQuery'
      query = Get-Content 'QA/support/fase9_9_0_resolve_agent_channel_for_qa.sql' -Raw
      options = [pscustomobject]@{}
    }
    type = 'n8n-nodes-base.postgres'
    typeVersion = 2.6
    position = @(1080,0)
    id = '1d776245-eef1-4d17-80ef-80b33cd62479'
    name = 'resolve_agent_channel_for_qa'
    credentials = [pscustomobject]@{ postgres = [pscustomobject]@{ id='a9C9SXdbhsOBvUzF'; name='Postgres account 2' } }
  }
}

if (-not ($wf90.nodes | Where-Object { $_.name -eq 'attach_agent_context_or_stop' })) {
  $wf90.nodes += [pscustomobject]@{
    parameters = [pscustomobject]@{ jsCode = Get-Content 'QA/support/fase9_9_0_attach_agent_context_or_stop.js' -Raw }
    type = 'n8n-nodes-base.code'
    typeVersion = 2
    position = @(1300,0)
    id = '8d708f8e-5209-4a32-8b2e-db76da3f0067'
    name = 'attach_agent_context_or_stop'
  }
}

if (-not ($wf90.nodes | Where-Object { $_.name -eq 'IF should_process' })) {
  $wf90.nodes += [pscustomobject]@{
    parameters = [pscustomobject]@{
      conditions = [pscustomobject]@{
        options = [pscustomobject]@{
          caseSensitive = $true
          leftValue = ''
          typeValidation = 'strict'
        }
        conditions = @(
          [pscustomobject]@{
            id = 'qa-should-process'
            leftValue = '={{ $json.should_process }}'
            rightValue = $true
            operator = [pscustomobject]@{
              type = 'boolean'
              operation = 'true'
              singleValue = $true
            }
          }
        )
        combinator = 'and'
      }
      options = [pscustomobject]@{}
    }
    type = 'n8n-nodes-base.if'
    typeVersion = 2.2
    position = @(1520,0)
    id = 'b7ff12b2-9d23-4b18-b478-889cd175a0f7'
    name = 'IF should_process'
  }
}

if (-not ($wf90.nodes | Where-Object { $_.name -eq 'return_not_processed' })) {
  $wf90.nodes += [pscustomobject]@{
    parameters = [pscustomobject]@{ jsCode = Get-Content 'QA/support/fase9_9_0_return_not_processed.js' -Raw }
    type = 'n8n-nodes-base.code'
    typeVersion = 2
    position = @(1760,160)
    id = 'b1b98f6a-59a2-46e2-9137-f6f134ec2fed'
    name = 'return_not_processed'
  }
}

($wf90.nodes | Where-Object { $_.name -eq 'resolve_agent_channel_for_qa' }).parameters.query = Get-Content 'QA/support/fase9_9_0_resolve_agent_channel_for_qa.sql' -Raw
($wf90.nodes | Where-Object { $_.name -eq 'attach_agent_context_or_stop' }).parameters.jsCode = Get-Content 'QA/support/fase9_9_0_attach_agent_context_or_stop.js' -Raw
($wf90.nodes | Where-Object { $_.name -eq 'return_not_processed' }).parameters.jsCode = Get-Content 'QA/support/fase9_9_0_return_not_processed.js' -Raw
($wf90.nodes | Where-Object { $_.name -eq "Call '2 lead_loader'" }).position = @(1760,-80)

$wf90.connections.'build_commercial_payload' = '{"main":[[{"node":"resolve_agent_channel_for_qa","type":"main","index":0}]]}' | ConvertFrom-Json
$wf90.connections | Add-Member -Force -NotePropertyName 'resolve_agent_channel_for_qa' -NotePropertyValue ('{"main":[[{"node":"attach_agent_context_or_stop","type":"main","index":0}]]}' | ConvertFrom-Json)
$wf90.connections | Add-Member -Force -NotePropertyName 'attach_agent_context_or_stop' -NotePropertyValue ('{"main":[[{"node":"IF should_process","type":"main","index":0}]]}' | ConvertFrom-Json)
$wf90.connections | Add-Member -Force -NotePropertyName 'IF should_process' -NotePropertyValue ('{"main":[[{"node":"Call ''2 lead_loader''","type":"main","index":0}],[{"node":"return_not_processed","type":"main","index":0}]]}' | ConvertFrom-Json)
$wf90.connections | Add-Member -Force -NotePropertyName 'return_not_processed' -NotePropertyValue ('{"main":[[]]}' | ConvertFrom-Json)
$wf90 | ConvertTo-Json -Depth 100 | Set-Content -Path $wf90Path -Encoding UTF8

$wf911 = Get-Content $wf911Path -Raw | ConvertFrom-Json
($wf911.nodes | Where-Object { $_.name -eq 'expand_steps' }).parameters.jsCode = Get-Content 'QA/support/fase9_9_1_expand_steps.js' -Raw
($wf911.nodes | Where-Object { $_.name -eq 'build_inbound_payload' }).parameters.jsCode = Get-Content 'QA/support/fase9_9_1_build_inbound_payload.js' -Raw
($wf911.nodes | Where-Object { $_.name -eq 'get_lead' }).parameters.query = @'
SELECT id, phone, external_id, organization_id, agent_id
FROM public.leads
WHERE phone = '{{ $("build_inbound_payload").item.json.phone }}'
   OR external_id = '{{ $("build_inbound_payload").item.json.phone }}'
ORDER BY created_at DESC
LIMIT 1;
'@
($wf911.nodes | Where-Object { $_.name -eq 'validate_step_result' }).parameters.jsCode = Get-Content 'QA/support/fase9_9_1_validate_step_result.js' -Raw
$wf911 | ConvertTo-Json -Depth 100 | Set-Content -Path $wf911Path -Encoding UTF8

Write-Host "OK: Fase 9 workflow patches applied."

