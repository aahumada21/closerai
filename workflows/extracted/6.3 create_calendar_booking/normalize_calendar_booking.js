// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.3 create_calendar_booking  (workflow id a3ec1c2d-0a59-46b1-a404-7a990234f3dc)
// Nodo:        normalize_calendar_booking
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const event = $json;
const req = $('build_calendar_event_payload').first().json;

return [
  {
    json: {
      calendar_event: {
        id: event.id || null,
        summary: event.summary || req.summary,
        description: event.description || req.description,
        start: event.start || { dateTime: req.slot_start_at },
        end: event.end || { dateTime: req.slot_end_at },
        status: event.status || null,
        htmlLink: event.htmlLink || null,
        location: event.location || req.location || null,
      },
      booking_context: {
        lead_id: req.lead_id,
        slot_id: req.slot_id,
        calendar_id: req.calendar_id,
        service_interest: req.service_interest,
        vehicle_type: req.vehicle_type,
        district: req.district,
        service_address: req.service_address,
        address_reference: req.address_reference,
        customer_name: req.customer_name,
        phone: req.phone,
      }
    }
  }
];
