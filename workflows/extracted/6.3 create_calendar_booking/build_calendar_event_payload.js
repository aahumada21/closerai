// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.3 create_calendar_booking  (workflow id a3ec1c2d-0a59-46b1-a404-7a990234f3dc)
// Nodo:        build_calendar_event_payload
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const {
  lead_id,
  agent_id,
  slot_id,
  slot_start_at,
  slot_end_at,
  service_interest,
  vehicle_type,
  district,
  service_address,
  address_reference,
  customer_name,
  phone,
  calendar_id,
} = $json;

// Validaciones mnimas del mdulo 6.3
if (!slot_start_at || !slot_end_at || !service_interest || !lead_id) {
  throw new Error('Faltan datos requeridos: slot_start_at, slot_end_at, service_interest o lead_id');
}

const start = DateTime.fromISO(slot_start_at);
const end = DateTime.fromISO(slot_end_at);

if (!start.isValid || !end.isValid) {
  throw new Error('slot_start_at o slot_end_at tienen formato invlido');
}

if (end <= start) {
  throw new Error('slot_end_at debe ser mayor que slot_start_at');
}

const cleanCustomerName = (customer_name || 'Cliente').trim();
const cleanService = String(service_interest).trim();
const cleanVehicle = vehicle_type ? String(vehicle_type).trim() : null;
const cleanDistrict = district ? String(district).trim() : null;
const cleanAddress = service_address ? String(service_address).trim() : null;
const cleanAddressReference = address_reference ? String(address_reference).trim() : null;
const cleanPhone = phone ? String(phone).trim() : null;

const summary = `${cleanService} - ${cleanCustomerName}`;

const descriptionLines = [
  `Lead ID: ${lead_id}`,
  `Cliente: ${cleanCustomerName}`,
  cleanPhone ? `Telfono: ${cleanPhone}` : null,
  `Servicio: ${cleanService}`,
  cleanVehicle ? `Vehculo: ${cleanVehicle}` : null,
  cleanDistrict ? `Comuna: ${cleanDistrict}` : null,
  cleanAddress ? `Direccion: ${cleanAddress}` : null,
  cleanAddressReference ? `Referencia: ${cleanAddressReference}` : null,
  `Slot ID: ${slot_id || ''}`,
].filter(Boolean);

const description = descriptionLines.join('\n');

return [
  {
    json: {
      lead_id,
      agent_id: agent_id || null,
      slot_id,
      calendar_id: calendar_id || 'primary',

      slot_start_at: start.toISO(),
      slot_end_at: end.toISO(),

      service_interest: cleanService,
      vehicle_type: cleanVehicle,
      district: cleanDistrict,
      service_address: cleanAddress,
      address_reference: cleanAddressReference,
      customer_name: cleanCustomerName,
      phone: cleanPhone,

      summary,
      description,
      location: cleanAddress || cleanDistrict || '',
    }
  }
];
