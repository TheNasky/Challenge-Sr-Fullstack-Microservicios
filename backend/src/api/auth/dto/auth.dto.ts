import { IsArray, IsNotEmpty } from 'class-validator';

export class PayloadDto {
  @IsNotEmpty()
  public email: string;

  @IsNotEmpty()
  public id: number;

  @IsArray()
  public roleIds: number[];
}
