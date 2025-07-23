import { Injectable } from '@angular/core';
import { NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

@Injectable()
export class CustomDateParserFormatter extends NgbDateParserFormatter {
  readonly DELIMITER = '/';

  parse(value: string): NgbDateStruct | null {
    if (!value) return null;
    const parts = value.split(this.DELIMITER);
    return {
      day: +parts[0],
      month: +parts[1],
      year: +parts[2]
    };
  }

  format(date: NgbDateStruct | null): string {
    if (!date) return '';
    const pad = (n: number) => n < 10 ? '0' + n : n;
    return `${pad(date.day)}${this.DELIMITER}${pad(date.month)}${this.DELIMITER}${date.year}`;
  }
}
