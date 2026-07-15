import { hotelService } from '@/lib/domain/hotel/service';
import { HotelManager } from './HotelManager';

export default async function HotelsPage() {
  const hotels = await hotelService.list();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">酒店管理</h1>
        <p className="text-sm text-slate-500">共 {hotels.length} 家酒店</p>
      </div>

      <HotelManager initialHotels={hotels} />
    </div>
  );
}
