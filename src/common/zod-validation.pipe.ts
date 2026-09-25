import { BadRequestException, type PipeTransform } from "@nestjs/common";
import { z } from "zod";

export class ZodValidationPipe implements PipeTransform {
    constructor(private readonly schema: z.ZodType){}

    transform(value: unknown) {
      const result = this.schema.safeParse(value)  
      if(!result.success){
        throw new BadRequestException(z.prettifyError(result.error))
      }
      return result.data
    }
}