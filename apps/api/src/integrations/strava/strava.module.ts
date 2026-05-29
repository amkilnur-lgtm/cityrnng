import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AttendancesModule } from "../../attendances/attendances.module";
import { AdminStravaController } from "./admin-strava.controller";
import { StravaApiClient } from "./strava-api.client";
import { StravaAccountsService } from "./strava-accounts.service";
import { StravaActivitiesService } from "./strava-activities.service";
import { StravaCachePurgeService } from "./strava-cache-purge.service";
import { StravaController } from "./strava.controller";
import { StravaIngestionService } from "./strava-ingestion.service";
import { StravaOAuthService } from "./strava-oauth.service";
import { StravaSubscriptionService } from "./strava-subscription.service";
import { StravaWebhookController } from "./strava-webhook.controller";
import { StravaWebhookService } from "./strava-webhook.service";

@Module({
  imports: [JwtModule.register({}), AttendancesModule],
  controllers: [StravaController, StravaWebhookController, AdminStravaController],
  providers: [
    StravaApiClient,
    StravaOAuthService,
    StravaAccountsService,
    StravaActivitiesService,
    StravaIngestionService,
    StravaCachePurgeService,
    StravaSubscriptionService,
    StravaWebhookService,
  ],
  exports: [
    StravaAccountsService,
    StravaActivitiesService,
    StravaIngestionService,
    StravaSubscriptionService,
  ],
})
export class StravaModule {}
