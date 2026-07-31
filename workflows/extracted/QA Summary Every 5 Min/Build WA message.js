// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: QA Summary Every 5 Min  (workflow id tL57zrWhC3irrlTB)
// Nodo:        Build WA message
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const total=Number($json.total_completados||0);const pasados=Number($json.total_pasados||0);const fallidos=Number($json.total_fallidos||0);const pct=total>0?Math.round((pasados/total)*100):0;const hora=new Date().toISOString().substring(11,16);const msg=`QA Resumen (${hora} UTC):\n- Completados: ${total}\n- Pasados: ${pasados} (${pct}%)\n- Fallidos: ${fallidos}`;return [{chatId:'1734857807',message:msg}];
