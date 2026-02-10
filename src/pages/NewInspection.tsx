// pages/NewInspection.tsx

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/common/Button';
import { TextField } from '@/components/common/TextField';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Header } from '@/components/layout/Header';
import { useInspectionStore } from '@/stores/inspectionStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { InspectionType } from '@/types/inspection';

const clientSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  company: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Valid phone number is required'),
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zip: z.string().min(5, 'ZIP code is required')
});

type ClientFormData = z.infer<typeof clientSchema>;

export function NewInspection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type') as InspectionType | null;
  const [inspectionType, setInspectionType] = useState<InspectionType>(
    typeParam || 'home'
  );
  const [isCreating, setIsCreating] = useState(false);

  const { createInspection, updateInspection } = useInspectionStore();
  const { user } = useSettingsStore();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      company: '',
      email: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      zip: ''
    }
  });

  const onSubmit = async (data: ClientFormData) => {
    setIsCreating(true);
    try {
      // Create the inspection
      const inspectionId = await createInspection(
        inspectionType,
        user?.id || 'local-user',
        user?.name || 'Inspector'
      );

      // Update with client and property info
      await updateInspection({
        clientInfo: {
          name: data.name,
          company: data.company || '',
          email: data.email,
          phone: data.phone
        },
        propertyAddress: {
          street: data.street,
          city: data.city,
          state: data.state,
          zip: data.zip
        }
      });

      // Navigate to the inspection
      navigate(`/inspection/${inspectionId}`);
    } catch (error) {
      console.error('Failed to create inspection:', error);
      alert('Failed to create inspection. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <Header title="New Inspection" showBack backTo="/" />

      <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-6">
        {/* Inspection Type */}
        <Card>
          <CardHeader>
            <CardTitle>Inspection Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setInspectionType('home')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  inspectionType === 'home'
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-3xl block mb-2">🏠</span>
                <span className="font-medium">Home</span>
              </button>
              <button
                type="button"
                onClick={() => setInspectionType('facility')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  inspectionType === 'facility'
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-3xl block mb-2">🏢</span>
                <span className="font-medium">Facility</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TextField
              label="Client Name *"
              placeholder="John Smith"
              error={errors.name?.message}
              {...register('name')}
            />
            <TextField
              label="Company (Optional)"
              placeholder="ABC Corporation"
              {...register('company')}
            />
            <TextField
              label="Email *"
              type="email"
              placeholder="john@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <TextField
              label="Phone *"
              type="tel"
              placeholder="(555) 123-4567"
              error={errors.phone?.message}
              {...register('phone')}
            />
          </CardContent>
        </Card>

        {/* Property Address */}
        <Card>
          <CardHeader>
            <CardTitle>Property Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TextField
              label="Street Address *"
              placeholder="123 Main Street"
              error={errors.street?.message}
              {...register('street')}
            />
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="City *"
                placeholder="Austin"
                error={errors.city?.message}
                {...register('city')}
              />
              <TextField
                label="State *"
                placeholder="TX"
                maxLength={2}
                error={errors.state?.message}
                {...register('state')}
              />
            </div>
            <TextField
              label="ZIP Code *"
              placeholder="78701"
              error={errors.zip?.message}
              {...register('zip')}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isCreating}
          >
            Start Inspection
          </Button>
        </div>
      </form>
    </div>
  );
}

export default NewInspection;
