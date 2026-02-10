// pages/BuildingData.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { TextField } from '@/components/common/TextField';
import { SelectField } from '@/components/common/SelectField';
import { Header } from '@/components/layout/Header';
import { useInspectionStore } from '@/stores/inspectionStore';
import { useAutoSave } from '@/hooks/useAutoSave';
import {
  propertyTypes,
  foundationTypes,
  roofTypes,
  exteriorMaterials,
  ceilingStructures,
  interiorWallMaterials,
  floorTypes,
  windowTypes,
  generatorTypes,
} from '@/data/buildingOptions';
import type { BuildingData as BuildingDataType } from '@/types/inspection';

export function BuildingData() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentInspection, loadInspection, updateInspection, isLoading, isSaving } =
    useInspectionStore();

  const [buildingData, setBuildingData] = useState<BuildingDataType>({
    lotSize: '',
    buildingSize: '',
    yearBuilt: '',
    propertyType: '',
    foundationType: '',
    roofType: '',
    exteriorMaterials: [],
    ceilingStructure: '',
    interiorWallMaterials: [],
    floorTypes: [],
    windowType: '',
    generatorType: '',
    rvParking: false,
    additionalParking: '',
    additionalFeatures: '',
  });

  // Load inspection if not already loaded
  useEffect(() => {
    if (id && !currentInspection) {
      loadInspection(id);
    }
  }, [id, currentInspection, loadInspection]);

  // Initialize form when inspection loads
  useEffect(() => {
    if (currentInspection) {
      setBuildingData(currentInspection.buildingData);
    }
  }, [currentInspection]);

  // Auto-save when building data changes
  useAutoSave({
    data: buildingData,
    onSave: async (data) => {
      if (currentInspection) {
        await updateInspection({ buildingData: data as BuildingDataType });
      }
    },
    enabled: !!currentInspection,
    debounceMs: 1000,
  });

  const handleTextChange = (field: keyof BuildingDataType) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setBuildingData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSelectChange = (field: keyof BuildingDataType) => (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setBuildingData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleMultiSelectToggle = (
    field: 'exteriorMaterials' | 'interiorWallMaterials' | 'floorTypes',
    value: string
  ) => {
    setBuildingData((prev) => {
      const currentValues = prev[field] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      return { ...prev, [field]: newValues };
    });
  };

  const handleNext = async () => {
    if (currentInspection) {
      await updateInspection({ buildingData });
    }
    navigate(`/inspection/${id}`);
  };

  if (isLoading || !currentInspection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin text-4xl">🔄</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <Header title="Building Data" showBack backTo={`/inspection/${id}/property`} />

      <div className="p-4 space-y-4">
        {/* Progress indicator */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="text-green-600">✓ Client</span>
          <span>→</span>
          <span className="text-green-600">✓ Property</span>
          <span>→</span>
          <span className="font-medium text-primary">3. Building</span>
          <span>→</span>
          <span>4. Inspection</span>
        </div>

        {/* Basic Information */}
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Information
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <TextField
                  label="Lot Size"
                  value={buildingData.lotSize}
                  onChange={handleTextChange('lotSize')}
                  placeholder="e.g., 0.5 acres"
                />
                <TextField
                  label="Building Size"
                  value={buildingData.buildingSize}
                  onChange={handleTextChange('buildingSize')}
                  placeholder="e.g., 2,500 sq ft"
                />
              </div>

              <TextField
                label="Year Built"
                value={buildingData.yearBuilt}
                onChange={handleTextChange('yearBuilt')}
                placeholder="e.g., 1995"
              />

              <SelectField
                label="Property Type"
                value={buildingData.propertyType}
                onChange={handleSelectChange('propertyType')}
                options={propertyTypes.map((t) => ({ value: t, label: t }))}
                placeholder="Select property type"
              />
            </div>
          </CardContent>
        </Card>

        {/* Structure */}
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Structure
            </h2>

            <div className="space-y-4">
              <SelectField
                label="Foundation Type"
                value={buildingData.foundationType}
                onChange={handleSelectChange('foundationType')}
                options={foundationTypes.map((t) => ({ value: t, label: t }))}
                placeholder="Select foundation type"
              />

              <SelectField
                label="Roof Type"
                value={buildingData.roofType}
                onChange={handleSelectChange('roofType')}
                options={roofTypes.map((t) => ({ value: t, label: t }))}
                placeholder="Select roof type"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exterior Materials (select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {exteriorMaterials.map((material) => (
                    <button
                      key={material}
                      type="button"
                      onClick={() => handleMultiSelectToggle('exteriorMaterials', material)}
                      className={`
                        px-3 py-1.5 rounded-full text-sm font-medium border transition-colors
                        ${
                          buildingData.exteriorMaterials?.includes(material)
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                        }
                      `}
                    >
                      {material}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interior */}
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Interior
            </h2>

            <div className="space-y-4">
              <SelectField
                label="Ceiling Structure"
                value={buildingData.ceilingStructure}
                onChange={handleSelectChange('ceilingStructure')}
                options={ceilingStructures.map((t) => ({ value: t, label: t }))}
                placeholder="Select ceiling structure"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interior Wall Materials (select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {interiorWallMaterials.map((material) => (
                    <button
                      key={material}
                      type="button"
                      onClick={() => handleMultiSelectToggle('interiorWallMaterials', material)}
                      className={`
                        px-3 py-1.5 rounded-full text-sm font-medium border transition-colors
                        ${
                          buildingData.interiorWallMaterials?.includes(material)
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                        }
                      `}
                    >
                      {material}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Floor Types (select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {floorTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleMultiSelectToggle('floorTypes', type)}
                      className={`
                        px-3 py-1.5 rounded-full text-sm font-medium border transition-colors
                        ${
                          buildingData.floorTypes?.includes(type)
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                        }
                      `}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <SelectField
                label="Window Type"
                value={buildingData.windowType}
                onChange={handleSelectChange('windowType')}
                options={windowTypes.map((t) => ({ value: t, label: t }))}
                placeholder="Select window type"
              />
            </div>
          </CardContent>
        </Card>

        {/* Additional Features */}
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Additional Features
            </h2>

            <div className="space-y-4">
              <SelectField
                label="Generator"
                value={buildingData.generatorType}
                onChange={handleSelectChange('generatorType')}
                options={generatorTypes.map((t) => ({ value: t, label: t }))}
                placeholder="Select generator type"
              />

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setBuildingData((prev) => ({ ...prev, rvParking: !prev.rvParking }))
                  }
                  className={`
                    w-6 h-6 rounded border-2 flex items-center justify-center
                    ${
                      buildingData.rvParking
                        ? 'bg-primary border-primary text-white'
                        : 'border-gray-300'
                    }
                  `}
                >
                  {buildingData.rvParking && '✓'}
                </button>
                <label className="text-sm font-medium text-gray-700">
                  RV Parking Available
                </label>
              </div>

              <TextField
                label="Additional Parking"
                value={buildingData.additionalParking}
                onChange={handleTextChange('additionalParking')}
                placeholder="e.g., 2-car garage, carport"
              />

              <TextField
                label="Additional Features / Notes"
                value={buildingData.additionalFeatures}
                onChange={handleTextChange('additionalFeatures')}
                placeholder="Any other notable features..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Auto-save indicator */}
        {isSaving && (
          <div className="text-center text-sm text-gray-500">
            <span className="animate-pulse">Saving...</span>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-bottom">
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate(`/inspection/${id}/property`)}
            className="flex-1"
          >
            Back
          </Button>
          <Button onClick={handleNext} className="flex-1">
            Start Inspection
          </Button>
        </div>
      </div>
    </div>
  );
}

export default BuildingData;
