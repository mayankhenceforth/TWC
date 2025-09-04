import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNumber, IsEnum, IsArray } from "class-validator";
import { PlanDurationUnit, PlanFeature } from "src/enums/plan.enum";

export class CreatePlanDto {
  @ApiProperty({ description: 'Name of the plan' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Price of the plan' })
  @IsNumber()
  price: number;

  @ApiProperty({ enum: ['USD', 'INR'], description: 'Currency of the plan' })
  @IsEnum(['USD', 'INR'])
  currency: 'USD' | 'INR';

  @ApiProperty({ description: 'Duration value of the plan' })
  @IsNumber()
  duration: number;

  @ApiProperty({ enum: PlanDurationUnit, description: 'Unit of duration (MONTH/YEAR)' })
  @IsEnum(PlanDurationUnit)
  durationUnit: PlanDurationUnit;

  @ApiProperty({ isArray: true, enum: PlanFeature, description: 'Features included in the plan' })
  @IsArray()
  @IsEnum(PlanFeature, { each: true })
  features: PlanFeature[];
}
