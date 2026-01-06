-- Create units table for managing individual units within properties
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    unit_number TEXT NOT NULL,
    bedrooms INTEGER,
    bathrooms NUMERIC(3,1),
    square_feet INTEGER,
    floor_number INTEGER,
    monthly_rent NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'vacant' CHECK (status IN ('vacant', 'occupied', 'maintenance', 'reserved')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(property_id, unit_number)
);

-- Add RLS policies for units
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- Landlords can view their own units
CREATE POLICY "units_select_own" ON public.units
    FOR SELECT
    USING (
        property_id IN (
            SELECT id FROM public.properties WHERE landlord_id = auth.uid()
        )
    );

-- Landlords can insert units for their properties
CREATE POLICY "units_insert_own" ON public.units
    FOR INSERT
    WITH CHECK (
        property_id IN (
            SELECT id FROM public.properties WHERE landlord_id = auth.uid()
        )
    );

-- Landlords can update their own units
CREATE POLICY "units_update_own" ON public.units
    FOR UPDATE
    USING (
        property_id IN (
            SELECT id FROM public.properties WHERE landlord_id = auth.uid()
        )
    );

-- Landlords can delete their own units
CREATE POLICY "units_delete_own" ON public.units
    FOR DELETE
    USING (
        property_id IN (
            SELECT id FROM public.properties WHERE landlord_id = auth.uid()
        )
    );

-- Add unit_id to tenants table to link tenants to specific units
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_units_property_id ON public.units(property_id);
CREATE INDEX IF NOT EXISTS idx_units_status ON public.units(status);
CREATE INDEX IF NOT EXISTS idx_tenants_unit_id ON public.tenants(unit_id);
