import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ResponsePropertyNote } from '../interfaces';

export class CreatePropertyNoteModel {
  @ApiProperty({
    description: 'ID do imovel',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty({ message: 'O ID do imovel e obrigatorio.' })
  @IsUUID('4', { message: 'O ID do imovel deve ser um UUID valido.' })
  propertyId: string;

  @ApiProperty({
    description: 'Texto da nota',
    example: 'Imovel apresenta boa iluminacao natural.',
  })
  @IsNotEmpty({ message: 'O texto da nota e obrigatorio.' })
  @IsString({ message: 'O texto da nota deve ser uma string.' })
  noteText: string;
}

export class GetPropertyNoteModel implements ResponsePropertyNote {
  @ApiProperty()
  id: string;

  @ApiProperty()
  propertyId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  noteText: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  deletedAt?: Date;
}
