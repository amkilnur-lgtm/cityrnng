import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  CityLocationStatus,
  Prisma,
  RecurrenceRuleStatus,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateRecurrenceRuleDto } from "./dto/create-recurrence-rule.dto";
import { UpdateRecurrenceRuleDto } from "./dto/update-recurrence-rule.dto";

const ruleInclude = Prisma.validator<Prisma.EventRecurrenceRuleDefaultArgs>()({
  include: {
    locations: {
      include: { location: true },
    },
  },
});

@Injectable()
export class RecurrenceRulesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.eventRecurrenceRule.findMany({
      orderBy: [{ status: "asc" }, { dayOfWeek: "asc" }],
      ...ruleInclude,
    });
  }

  async getByIdOrThrow(id: string) {
    const rule = await this.prisma.eventRecurrenceRule.findUnique({
      where: { id },
      ...ruleInclude,
    });
    if (!rule) throw new NotFoundException({ code: "RECURRENCE_RULE_NOT_FOUND" });
    return rule;
  }

  async create(dto: CreateRecurrenceRuleDto, createdById: string) {
    await this.assertLocationsExist(dto.locationIds);
    assertDateRange(dto.startsFromDate, dto.endsAtDate);

    return this.prisma.eventRecurrenceRule.create({
      data: {
        title: dto.title,
        type: dto.type,
        status: dto.status ?? RecurrenceRuleStatus.active,
        dayOfWeek: dto.dayOfWeek,
        timeOfDay: dto.timeOfDay,
        durationMinutes: dto.durationMinutes,
        isPointsEligible: dto.isPointsEligible ?? true,
        basePointsAward: dto.basePointsAward ?? 0,
        startsFromDate: new Date(dto.startsFromDate),
        endsAtDate: dto.endsAtDate ? new Date(dto.endsAtDate) : null,
        createdById,
        locations: {
          create: dto.locationIds.map((locationId) => ({ locationId })),
        },
      },
      ...ruleInclude,
    });
  }

  async update(id: string, dto: UpdateRecurrenceRuleDto) {
    const existing = await this.getByIdOrThrow(id);
    if (dto.locationIds) await this.assertLocationsExist(dto.locationIds);

    const startsFromDate = dto.startsFromDate
      ? new Date(dto.startsFromDate)
      : existing.startsFromDate;
    const endsAtDate = dto.endsAtDate
      ? new Date(dto.endsAtDate)
      : existing.endsAtDate;
    if (endsAtDate && startsFromDate > endsAtDate) {
      throw new BadRequestException({ code: "RULE_INVALID_DATE_RANGE" });
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.eventRecurrenceRule.update({
        where: { id },
        data: {
          title: dto.title,
          type: dto.type,
          status: dto.status,
          dayOfWeek: dto.dayOfWeek,
          timeOfDay: dto.timeOfDay,
          durationMinutes: dto.durationMinutes,
          isPointsEligible: dto.isPointsEligible,
          basePointsAward: dto.basePointsAward,
          startsFromDate: dto.startsFromDate ? new Date(dto.startsFromDate) : undefined,
          endsAtDate: dto.endsAtDate ? new Date(dto.endsAtDate) : undefined,
        },
      });

      if (dto.locationIds) {
        await tx.eventRecurrenceRuleLocation.deleteMany({
          where: { ruleId: id },
        });
        await tx.eventRecurrenceRuleLocation.createMany({
          data: dto.locationIds.map((locationId) => ({
            ruleId: id,
            locationId,
          })),
        });
      }

      return tx.eventRecurrenceRule.findUniqueOrThrow({
        where: { id: updated.id },
        ...ruleInclude,
      });
    });
  }

  private async assertLocationsExist(ids: string[]) {
    const found = await this.prisma.cityLocation.count({
      where: { id: { in: ids }, status: CityLocationStatus.active },
    });
    if (found !== ids.length) {
      throw new BadRequestException({ code: "RULE_LOCATIONS_INVALID" });
    }
  }
}

function assertDateRange(startsFromDate: string, endsAtDate?: string) {
  if (endsAtDate && new Date(startsFromDate) > new Date(endsAtDate)) {
    throw new BadRequestException({ code: "RULE_INVALID_DATE_RANGE" });
  }
}
