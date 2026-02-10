// data/inspectionCategories.ts

import type { InspectionCategory } from '@/types/inspection';

export const inspectionCategories: InspectionCategory[] = [
  {
    id: 'exterior',
    name: 'Exterior',
    icon: '🏠',
    limitations: 'The exterior inspection is limited to visible and accessible areas only. Areas concealed by vegetation, snow, stored items, or other obstructions were not inspected. Underground drainage systems, buried utilities, and structural elements below grade were not evaluated.',
    items: [
      { id: 'ext-foundation', name: 'Foundation', categoryId: 'exterior' },
      { id: 'ext-grading', name: 'Lot Grading & Drainage', categoryId: 'exterior' },
      { id: 'ext-driveways', name: 'Driveways/Walkways/Patios', categoryId: 'exterior' },
      { id: 'ext-decks', name: 'Decks/Porches/Stairs/Railings', categoryId: 'exterior' },
      { id: 'ext-vegetation', name: 'Vegetation', categoryId: 'exterior' },
      { id: 'ext-parking', name: 'Parking Areas/Additional Structures', categoryId: 'exterior' },
      { id: 'ext-walls', name: 'Exterior Walls', categoryId: 'exterior' },
      { id: 'ext-windows', name: 'Windows', categoryId: 'exterior' },
      { id: 'ext-doors', name: 'Doors', categoryId: 'exterior' },
      { id: 'ext-other', name: 'Other', categoryId: 'exterior' },
    ]
  },
  {
    id: 'interior',
    name: 'Interior',
    icon: '🪑',
    limitations: 'The interior inspection is limited to visible and accessible areas. Furniture, stored items, and personal belongings were not moved. Areas behind walls, above ceilings, and below floors were not inspected. Cosmetic conditions are noted but not the primary focus of this inspection.',
    items: [
      { id: 'int-walls', name: 'Walls & Ceilings', categoryId: 'interior' },
      { id: 'int-floors', name: 'Floors & Transitions', categoryId: 'interior' },
      { id: 'int-stairs', name: 'Stairs / Railings', categoryId: 'interior' },
      { id: 'int-doors', name: 'Doors', categoryId: 'interior' },
      { id: 'int-windows', name: 'Windows', categoryId: 'interior' },
      { id: 'int-appliances', name: 'Built-in Appliances', categoryId: 'interior' },
      { id: 'int-other', name: 'Other', categoryId: 'interior' },
    ]
  },
  {
    id: 'roofing',
    name: 'Roofing',
    icon: '🏚️',
    limitations: 'The roof inspection was performed from ground level and/or accessible areas. Walking on the roof surface was limited based on safety considerations, roof pitch, and surface conditions. Roof covering life expectancy estimates are approximations only. Hidden damage beneath roofing materials cannot be detected without removal.',
    items: [
      { id: 'roof-material', name: 'Roofing Material', categoryId: 'roofing' },
      { id: 'roof-gutters', name: 'Gutters & Downspouts', categoryId: 'roofing' },
      { id: 'roof-flashing', name: 'Flashing', categoryId: 'roofing' },
      { id: 'roof-penetrations', name: 'Skylights / Chimneys / Roof Penetrations', categoryId: 'roofing' },
      { id: 'roof-other', name: 'Other', categoryId: 'roofing' },
    ]
  },
  {
    id: 'plumbing',
    name: 'Plumbing',
    icon: '🚿',
    limitations: 'The plumbing inspection is limited to visible and accessible components only. Pipes concealed within walls, floors, ceilings, or underground were not inspected. Water quality, flow rate measurements, and well/septic systems require specialized testing not included in this inspection. Interior pipe conditions cannot be determined without camera inspection.',
    items: [
      { id: 'plumb-supply', name: 'Supply Line (visible)', categoryId: 'plumbing' },
      { id: 'plumb-heater', name: 'Water Heater', categoryId: 'plumbing' },
      { id: 'plumb-bibs', name: 'Exterior Hose Bibs', categoryId: 'plumbing' },
      { id: 'plumb-fixtures', name: 'Interior Faucets and Fixtures', categoryId: 'plumbing' },
      { id: 'plumb-other', name: 'Other', categoryId: 'plumbing' },
    ]
  },
  {
    id: 'electrical',
    name: 'Electrical',
    icon: '⚡',
    limitations: 'The electrical inspection is limited to visible and accessible components. Wiring concealed within walls, ceilings, floors, and conduits was not inspected. Panel covers were removed where safe to do so. Low-voltage systems, security systems, and specialized circuits require evaluation by qualified specialists. This inspection does not constitute a code compliance evaluation.',
    items: [
      { id: 'elec-panel', name: 'Service Entry & Main Panel', categoryId: 'electrical' },
      { id: 'elec-subpanels', name: 'Sub Panels', categoryId: 'electrical' },
      { id: 'elec-breakers', name: 'Breakers / Fuses', categoryId: 'electrical' },
      { id: 'elec-wiring', name: 'Wiring', categoryId: 'electrical' },
      { id: 'elec-fixtures', name: 'Fixtures / Switches / Receptacles', categoryId: 'electrical' },
      { id: 'elec-gfci', name: 'GFCI / AFCI', categoryId: 'electrical' },
      { id: 'elec-other', name: 'Other', categoryId: 'electrical' },
    ]
  },
  {
    id: 'hvac',
    name: 'Heating and Cooling',
    icon: '🌡️',
    limitations: 'The HVAC inspection is limited to visible and accessible components and basic operational testing. Heat exchangers, internal components, and refrigerant levels require specialized equipment and licensed technicians to fully evaluate. Ductwork concealed within walls and ceilings was not inspected. Efficiency ratings and remaining useful life are estimates only.',
    items: [
      { id: 'hvac-heating', name: 'Heating System', categoryId: 'hvac' },
      { id: 'hvac-venting', name: 'Venting / Flues / Chimney', categoryId: 'hvac' },
      { id: 'hvac-cooling', name: 'Cooling System', categoryId: 'hvac' },
      { id: 'hvac-thermostat', name: 'Thermostat Operation', categoryId: 'hvac' },
      { id: 'hvac-other', name: 'Other', categoryId: 'hvac' },
    ]
  },
  {
    id: 'insulation',
    name: 'Insulation & Ventilation',
    icon: '🧊',
    limitations: 'The insulation inspection is limited to visible and accessible areas, primarily the attic and crawlspace where accessible. Insulation within walls cannot be evaluated without invasive testing. R-value estimates are visual approximations. Vapor barrier inspection is limited to visible areas of crawlspaces.',
    items: [
      { id: 'ins-attic', name: 'Attic Insulation', categoryId: 'insulation' },
      { id: 'ins-crawlspace', name: 'Crawlspace Insulation', categoryId: 'insulation' },
      { id: 'ins-ventilation', name: 'Ventilation', categoryId: 'insulation' },
      { id: 'ins-vapor', name: 'Vapor Barriers', categoryId: 'insulation' },
      { id: 'ins-other', name: 'Other', categoryId: 'insulation' },
    ]
  },
  {
    id: 'fireplace',
    name: 'Fireplaces & Fuel Burning Appliances',
    icon: '🔥',
    limitations: 'The fireplace and fuel-burning appliance inspection is limited to visible components. Flue interiors, chimney liner conditions, and internal combustion chambers require specialized camera inspection by a certified chimney sweep. Gas connections should be evaluated by a licensed plumber or gas technician. Fires were not started during this inspection.',
    items: [
      { id: 'fire-firebox', name: 'Firebox', categoryId: 'fireplace' },
      { id: 'fire-chimney', name: 'Chimney / Vent Visible', categoryId: 'fireplace' },
      { id: 'fire-dampers', name: 'Dampers / Accessories', categoryId: 'fireplace' },
      { id: 'fire-other', name: 'Other', categoryId: 'fireplace' },
    ]
  },
  {
    id: 'safety',
    name: 'Safety & Misc.',
    icon: '🛡️',
    limitations: 'The safety inspection includes visual verification of detector presence and basic testing where accessible. Battery conditions and sensor calibration require specialized testing. Security system functionality should be verified with the monitoring company. Environmental hazards such as mold, asbestos, radon, and lead require specialized testing not included in this inspection.',
    items: [
      { id: 'safe-detectors', name: 'Smoke / CO Detectors', categoryId: 'safety' },
      { id: 'safe-security', name: 'Security Systems', categoryId: 'safety' },
      { id: 'safe-other', name: 'Other', categoryId: 'safety' },
    ]
  },
];

// Helper to get category by ID
export const getCategoryById = (id: string): InspectionCategory | undefined => {
  return inspectionCategories.find(cat => cat.id === id);
};

// Helper to get item by ID (returns item with category info)
export const getItemWithCategory = (itemId: string) => {
  for (const category of inspectionCategories) {
    const item = category.items.find(i => i.id === itemId);
    if (item) {
      return { item, category };
    }
  }
  return undefined;
};

// Helper to get just the item by ID
export const getItemById = (itemId: string) => {
  for (const category of inspectionCategories) {
    const item = category.items.find(i => i.id === itemId);
    if (item) {
      return item;
    }
  }
  return undefined;
};

// Get all items flat
export const getAllItems = () => {
  return inspectionCategories.flatMap(cat => cat.items);
};

// Get total item count
export const getTotalItemCount = () => {
  return inspectionCategories.reduce((sum, cat) => sum + cat.items.length, 0);
};
