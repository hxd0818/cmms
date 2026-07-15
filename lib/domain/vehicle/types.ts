import type { Vehicle } from '@/lib/generated/prisma/client';
import type { VehicleType } from '@/lib/generated/prisma/enums';

export type VehicleEntity = Vehicle;

export interface VehicleCreateData {
  plateNo: string;
  type: VehicleType;
  capacity: number;
  driverName: string;
  driverPhone: string;
  belongs?: string;
}

export interface VehicleUpdateData {
  plateNo?: string;
  type?: VehicleType;
  capacity?: number;
  driverName?: string;
  driverPhone?: string;
  belongs?: string | null;
}

export interface VehicleListParams {
  search?: string;
  page?: number;
  pageSize?: number;
}
