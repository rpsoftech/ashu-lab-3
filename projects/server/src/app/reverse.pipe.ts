import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'reverse',
  pure:false,
})
export class ReversePipe implements PipeTransform {
  transform(value: string[]): string[] {
    return value
      .slice(value.length < 6 ? 0 : value.length - 6, value.length )
      .reverse();
  }
}
