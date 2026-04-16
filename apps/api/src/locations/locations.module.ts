import { Module } from "@nestjs/common";
import { AdminLocationsController } from "./admin-locations.controller";
import { LocationsService } from "./locations.service";

@Module({
  controllers: [AdminLocationsController],
  providers: [LocationsService],
  exports: [LocationsService],
})
export class LocationsModule {}
