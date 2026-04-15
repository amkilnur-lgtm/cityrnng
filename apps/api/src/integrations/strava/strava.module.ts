import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AttendancesModule } from "../../attendances/attendances.module";
import { AdminStravaController } from "./admin-strava.controller";
import { StravaApiClient } from "./strava-api.client";
import { StravaAccountsService } from "./strava-accounts.service";
import { StravaActivitiesService } from "./strava-activities.service";
import { StravaController } from "./strava.controller";
import { StravaIngestionService } from "./strava-ingestion.service";
import { StravaOAuthService } from "./strava-oauth.service";

@Module({
  imports: [JwtModule.register({}), AttendancesModule],
  controllers: [StravaController, AdminStravaController],
  providers: [
    StravaApiClient,
    StravaOAuthService,
    StravaAccountsService,
    StravaActivitiesService,
    StravaIngestionService,
  ],
  exports: [StravaAccountsService, StravaActivitiesService, StravaIngestionService],
})
export class StravaModule {}
