import {isFuture} from '../future';
import {partial1} from '../internal/utils';
import {throwInvalidFuture} from '../internal/throw';

function or$left(left, right){
  if(!isFuture(right)) throwInvalidFuture('or', 1, right);
  return left.or(right);
}

export function or(left, right){
  if(!isFuture(left)) throwInvalidFuture('or', 0, left);
  if(arguments.length === 1) return partial1(or$left, left);
  return or$left(left, right);
}
