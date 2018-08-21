import {show, showf, noop, moop, raise} from './internal/utils';
import {isFunction} from './internal/predicates';
import {FL, $$type} from './internal/const';
import interpret from './internal/interpreter';
import {nil, cons} from './internal/list';
import type from 'sanctuary-type-identifiers';
import {error, typeError, invalidFuture, valueToError} from './internal/error';
import {throwInvalidArgument, throwInvalidContext, throwInvalidFuture} from './internal/throw';

function Future$onCrash(x){
  raise(valueToError(x));
}

export function Future(computation){
  if(!isFunction(computation)) throwInvalidArgument('Future', 0, 'be a Function', computation);
  return new Computation(computation);
}

export function isFuture(x){
  return x instanceof Future || type(x) === $$type;
}

Future['@@type'] = $$type;

Future.prototype['@@show'] = function Future$show(){
  return this.toString();
};

Future.prototype[FL.ap] = function Future$FL$ap(other){
  return other._ap(this);
};

Future.prototype[FL.map] = function Future$FL$map(mapper){
  return this._map(mapper);
};

Future.prototype[FL.bimap] = function Future$FL$bimap(lmapper, rmapper){
  return this._bimap(lmapper, rmapper);
};

Future.prototype[FL.chain] = function Future$FL$chain(mapper){
  return this._chain(mapper);
};

Future.prototype.ap = function Future$ap(other){
  if(!isFuture(this)) throwInvalidContext('Future#ap', this);
  if(!isFuture(other)) throwInvalidFuture('Future#ap', 0, other);
  return this._ap(other);
};

Future.prototype.map = function Future$map(mapper){
  if(!isFuture(this)) throwInvalidContext('Future#map', this);
  if(!isFunction(mapper)) throwInvalidArgument('Future#map', 0, 'to be a Function', mapper);
  return this._map(mapper);
};

Future.prototype.bimap = function Future$bimap(lmapper, rmapper){
  if(!isFuture(this)) throwInvalidContext('Future#bimap', this);
  if(!isFunction(lmapper)) throwInvalidArgument('Future#bimap', 0, 'to be a Function', lmapper);
  if(!isFunction(rmapper)) throwInvalidArgument('Future#bimap', 1, 'to be a Function', rmapper);
  return this._bimap(lmapper, rmapper);
};

Future.prototype.chain = function Future$chain(mapper){
  if(!isFuture(this)) throwInvalidContext('Future#chain', this);
  if(!isFunction(mapper)) throwInvalidArgument('Future#chain', 0, 'to be a Function', mapper);
  return this._chain(mapper);
};

Future.prototype.mapRej = function Future$mapRej(mapper){
  if(!isFuture(this)) throwInvalidContext('Future#mapRej', this);
  if(!isFunction(mapper)) throwInvalidArgument('Future#mapRej', 0, 'to be a Function', mapper);
  return this._mapRej(mapper);
};

Future.prototype.chainRej = function Future$chainRej(mapper){
  if(!isFuture(this)) throwInvalidContext('Future#chainRej', this);
  if(!isFunction(mapper)) throwInvalidArgument('Future#chainRej', 0, 'to be a Function', mapper);
  return this._chainRej(mapper);
};

Future.prototype.race = function Future$race(other){
  if(!isFuture(this)) throwInvalidContext('Future#race', this);
  if(!isFuture(other)) throwInvalidFuture('Future#race', 0, other);
  return this._race(other);
};

Future.prototype.both = function Future$both(other){
  if(!isFuture(this)) throwInvalidContext('Future#both', this);
  if(!isFuture(other)) throwInvalidFuture('Future#both', 0, other);
  return this._both(other);
};

Future.prototype.and = function Future$and(other){
  if(!isFuture(this)) throwInvalidContext('Future#and', this);
  if(!isFuture(other)) throwInvalidFuture('Future#and', 0, other);
  return this._and(other);
};

Future.prototype.or = function Future$or(other){
  if(!isFuture(this)) throwInvalidContext('Future#or', this);
  if(!isFuture(other)) throwInvalidFuture('Future#or', 0, other);
  return this._or(other);
};

Future.prototype.swap = function Future$swap(){
  if(!isFuture(this)) throwInvalidContext('Future#ap', this);
  return this._swap();
};

Future.prototype.fold = function Future$fold(lmapper, rmapper){
  if(!isFuture(this)) throwInvalidContext('Future#ap', this);
  if(!isFunction(lmapper)) throwInvalidArgument('Future#fold', 0, 'to be a Function', lmapper);
  if(!isFunction(rmapper)) throwInvalidArgument('Future#fold', 1, 'to be a Function', rmapper);
  return this._fold(lmapper, rmapper);
};

Future.prototype.finally = function Future$finally(other){
  if(!isFuture(this)) throwInvalidContext('Future#finally', this);
  if(!isFuture(other)) throwInvalidFuture('Future#finally', 0, other);
  return this._finally(other);
};

Future.prototype.lastly = function Future$lastly(other){
  if(!isFuture(this)) throwInvalidContext('Future#lastly', this);
  if(!isFuture(other)) throwInvalidFuture('Future#lastly', 0, other);
  return this._finally(other);
};

Future.prototype.fork = function Future$fork(rej, res){
  if(!isFuture(this)) throwInvalidContext('Future#fork', this);
  if(!isFunction(rej)) throwInvalidArgument('Future#fork', 0, 'to be a Function', rej);
  if(!isFunction(res)) throwInvalidArgument('Future#fork', 1, 'to be a Function', res);
  return this._interpret(Future$onCrash, rej, res);
};

Future.prototype.forkCatch = function Future$forkCatch(rec, rej, res){
  if(!isFuture(this)) throwInvalidContext('Future#fork', this);
  if(!isFunction(rec)) throwInvalidArgument('Future#fork', 0, 'to be a Function', rec);
  if(!isFunction(rej)) throwInvalidArgument('Future#fork', 1, 'to be a Function', rej);
  if(!isFunction(res)) throwInvalidArgument('Future#fork', 2, 'to be a Function', res);
  return this._interpret(function Future$forkCatch$recover(x){ rec(valueToError(x)) }, rej, res);
};

Future.prototype.value = function Future$value(res){
  if(!isFuture(this)) throwInvalidContext('Future#value', this);
  if(!isFunction(res)) throwInvalidArgument('Future#value', 0, 'to be a Function', res);
  var _this = this;
  return _this._interpret(Future$onCrash, function Future$value$rej(x){
    raise(error(
      'Future#value was called on a rejected Future\n' +
      '  Rejection: ' + show(x) + '\n' +
      '  Future: ' + _this.toString()
    ));
  }, res);
};

Future.prototype.done = function Future$done(callback){
  if(!isFuture(this)) throwInvalidContext('Future#done', this);
  if(!isFunction(callback)) throwInvalidArgument('Future#done', 0, 'to be a Function', callback);
  return this._interpret(Future$onCrash,
                         function Future$done$rej(x){ callback(x) },
                         function Future$done$res(x){ callback(null, x) });
};

Future.prototype.promise = function Future$promise(){
  var _this = this;
  return new Promise(function Future$promise$computation(res, rej){
    _this._interpret(Future$onCrash, rej, res);
  });
};

Future.prototype.extractLeft = function Future$extractLeft(){
  return [];
};

Future.prototype.extractRight = function Future$extractRight(){
  return [];
};

Future.prototype._transform = function Future$transform(action){
  return new Transformation(this, cons(action, nil));
};

Future.prototype._ap = function Future$ap(other){
  return this._transform(new ApAction(other));
};

Future.prototype._parallelAp = function Future$pap(other){
  return this._transform(new ParallelApAction(other));
};

Future.prototype._map = function Future$map(mapper){
  return this._transform(new MapAction(mapper));
};

Future.prototype._bimap = function Future$bimap(lmapper, rmapper){
  return this._transform(new BimapAction(lmapper, rmapper));
};

Future.prototype._chain = function Future$chain(mapper){
  return this._transform(new ChainAction(mapper));
};

Future.prototype._mapRej = function Future$mapRej(mapper){
  return this._transform(new MapRejAction(mapper));
};

Future.prototype._chainRej = function Future$chainRej(mapper){
  return this._transform(new ChainRejAction(mapper));
};

Future.prototype._race = function Future$race(other){
  return isNever(other) ? this : this._transform(new RaceAction(other));
};

Future.prototype._both = function Future$both(other){
  return this._transform(new BothAction(other));
};

Future.prototype._and = function Future$and(other){
  return this._transform(new AndAction(other));
};

Future.prototype._or = function Future$or(other){
  return this._transform(new OrAction(other));
};

Future.prototype._swap = function Future$swap(){
  return this._transform(new SwapAction);
};

Future.prototype._fold = function Future$fold(lmapper, rmapper){
  return this._transform(new FoldAction(lmapper, rmapper));
};

Future.prototype._finally = function Future$finally(other){
  return this._transform(new FinallyAction(other));
};

export function Computation(computation){
  this._computation = computation;
}

Computation.prototype = Object.create(Future.prototype);

Computation.prototype._interpret = function Computation$interpret(rec, rej, res){
  var open = false, cancel = noop, cont = function(){ open = true };
  try{
    cancel = this._computation(function Computation$rej(x){
      cont = function Computation$rej$cont(){
        open = false;
        rej(x);
      };
      if(open){
        cont();
      }
    }, function Computation$res(x){
      cont = function Computation$res$cont(){
        open = false;
        res(x);
      };
      if(open){
        cont();
      }
    }) || noop;
  }catch(e){
    open = false;
    rec(e);
    return noop;
  }
  if(!(isFunction(cancel) && cancel.length === 0)){
    rec(typeError(
      'The computation was expected to return a nullary function or void\n' +
      '  Actual: ' + show(cancel)
    ));
  }
  cont();
  return function Computation$cancel(){
    if(open){
      open = false;
      cancel && cancel();
    }
  };
};

Computation.prototype.toString = function Computation$toString(){
  return 'Future(' + showf(this._computation) + ')';
};

export function Transformation(spawn, actions){
  this._spawn = spawn;
  this._actions = actions;
}

Transformation.prototype = Object.create(Future.prototype);

Transformation.prototype._transform = function Transformation$_transform(action){
  return new Transformation(this._spawn, cons(action, this._actions));
};

Transformation.prototype._interpret = function Transformation$interpret(rec, rej, res){
  return interpret(this, rec, rej, res);
};

Transformation.prototype.toString = function Transformation$toString(){
  var str = '', tail = this._actions;

  while(tail !== nil){
    str = '.' + tail.head.toString() + str;
    tail = tail.tail;
  }

  return this._spawn.toString() + str;
};

export function Crashed(error){
  this._error = error;
}

Crashed.prototype = Object.create(Future.prototype);

Crashed.prototype._ap = moop;
Crashed.prototype._parallelAp = moop;
Crashed.prototype._map = moop;
Crashed.prototype._bimap = moop;
Crashed.prototype._chain = moop;
Crashed.prototype._mapRej = moop;
Crashed.prototype._chainRej = moop;
Crashed.prototype._both = moop;
Crashed.prototype._or = moop;
Crashed.prototype._swap = moop;
Crashed.prototype._fold = moop;
Crashed.prototype._finally = moop;
Crashed.prototype._race = moop;

Crashed.prototype._interpret = function Crashed$interpret(rec){
  rec(this._error);
  return noop;
};

export function Rejected(value){
  this._value = value;
}

Rejected.prototype = Object.create(Future.prototype);

Rejected.prototype._ap = moop;
Rejected.prototype._parallelAp = moop;
Rejected.prototype._map = moop;
Rejected.prototype._chain = moop;
Rejected.prototype._race = moop;
Rejected.prototype._both = moop;
Rejected.prototype._and = moop;

Rejected.prototype._or = function Rejected$or(other){
  return other;
};

Rejected.prototype._finally = function Rejected$finally(other){
  return other._and(this);
};

Rejected.prototype._swap = function Rejected$swap(){
  return new Resolved(this._value);
};

Rejected.prototype._interpret = function Rejected$interpret(rec, rej){
  rej(this._value);
  return noop;
};

Rejected.prototype.extractLeft = function Rejected$extractLeft(){
  return [this._value];
};

Rejected.prototype.toString = function Rejected$toString(){
  return 'Future.reject(' + show(this._value) + ')';
};

export function reject(x){
  return new Rejected(x);
}

export function Resolved(value){
  this._value = value;
}

Resolved.prototype = Object.create(Future.prototype);

Resolved.prototype._race = moop;
Resolved.prototype._mapRej = moop;
Resolved.prototype._or = moop;

Resolved.prototype._and = function Resolved$and(other){
  return other;
};

Resolved.prototype._both = function Resolved$both(other){
  var left = this._value;
  return other._map(function Resolved$both$mapper(right){
    return [left, right];
  });
};

Resolved.prototype._swap = function Resolved$swap(){
  return new Rejected(this._value);
};

Resolved.prototype._finally = function Resolved$finally(other){
  var value = this._value;
  return other._map(function Resolved$finally$mapper(){
    return value;
  });
};

Resolved.prototype._interpret = function Resolved$interpret(rec, rej, res){
  res(this._value);
  return noop;
};

Resolved.prototype.extractRight = function Resolved$extractRight(){
  return [this._value];
};

Resolved.prototype.toString = function Resolved$toString(){
  return 'Future.of(' + show(this._value) + ')';
};

export function resolve(x){
  return new Resolved(x);
}

function Never(){
  this._isNever = true;
}

Never.prototype = Object.create(Future.prototype);

Never.prototype._ap = moop;
Never.prototype._parallelAp = moop;
Never.prototype._map = moop;
Never.prototype._bimap = moop;
Never.prototype._chain = moop;
Never.prototype._mapRej = moop;
Never.prototype._chainRej = moop;
Never.prototype._both = moop;
Never.prototype._or = moop;
Never.prototype._swap = moop;
Never.prototype._fold = moop;
Never.prototype._finally = moop;

Never.prototype._race = function Never$race(other){
  return other;
};

Never.prototype._interpret = function Never$interpret(){
  return noop;
};

Never.prototype.toString = function Never$toString(){
  return 'Future.never';
};

export var never = new Never();

export function isNever(x){
  return isFuture(x) && x._isNever === true;
}

function Eager(future){
  var _this = this;
  _this.rec = noop;
  _this.rej = noop;
  _this.res = noop;
  _this.crashed = false;
  _this.rejected = false;
  _this.resolved = false;
  _this.value = null;
  _this.cancel = future._interpret(function Eager$crash(x){
    _this.value = x;
    _this.crashed = true;
    _this.cancel = noop;
    _this.rec(x);
  }, function Eager$reject(x){
    _this.value = x;
    _this.rejected = true;
    _this.cancel = noop;
    _this.rej(x);
  }, function Eager$resolve(x){
    _this.value = x;
    _this.resolved = true;
    _this.cancel = noop;
    _this.res(x);
  });
}

Eager.prototype = Object.create(Future.prototype);

Eager.prototype._interpret = function Eager$interpret(rec, rej, res){
  if(this.crashed) rec(this.value);
  else if(this.rejected) rej(this.value);
  else if(this.resolved) res(this.value);
  else{
    this.rec = rec;
    this.rej = rej;
    this.res = res;
  }
  return this.cancel;
};

export var Action = {
  name: 'noop',
  rejected: function Action$rejected(x){ this.cancel(); return new Rejected(x) },
  resolved: function Action$resolved(x){ this.cancel(); return new Resolved(x) },
  toString: function Action$toString(){ return this.name + '()' },
  run: moop,
  cancel: noop
};

function mapperActionToString(){
  return this.name + '(' + showf(this.mapper) + ')';
}

function bimapperActionToString(){
  return this.name + '(' + showf(this.lmapper) + ', ' + showf(this.rmapper) + ')';
}

function otherActionToString(){
  return this.name + '(' + this.other.toString() + ')';
}

function chainActionHandler(x){
  var m;
  try{ m = this.mapper(x) }catch(e){ return new Crashed(e) }
  return isFuture(m) ? m : new Crashed(invalidFuture(
    'Future#' + this.name,
    'the function it\'s given to return a Future',
    m,
    '\n  From calling: ' + showf(this.mapper) + '\n  With: ' + show(x)
  ));
}

function returnOther(){
  return this.other;
}

function mapWith(mapper, create, value){
  var m;
  try{ m = create(mapper(value)) }catch(e){ m = new Crashed(e) }
  return m;
}

function mapRight(value){
  return mapWith(this.rmapper, resolve, value);
}

export function ApAction(other){ this.other = other }
ApAction.prototype = Object.create(Action);
ApAction.prototype.name = 'ap';
ApAction.prototype.toString = otherActionToString;
ApAction.prototype.resolved = function ApAction$resolved(f){
  return isFunction(f) ?
         this.other._map(function ApAction$resolved$mapper(x){ return f(x) }) :
         new Crashed(typeError(
           'Future#' + this.name + ' expects its first argument to be a Future of a Function\n' +
           '  Actual: Future.of(' + show(f) + ')'
         ));
};

export function MapAction(mapper){ this.mapper = mapper }
MapAction.prototype = Object.create(Action);
MapAction.prototype.name = 'map';
MapAction.prototype.toString = mapperActionToString;
MapAction.prototype.resolved = function MapAction$resolved(x){
  return mapWith(this.mapper, resolve, x);
};

export function BimapAction(lmapper, rmapper){ this.lmapper = lmapper; this.rmapper = rmapper }
BimapAction.prototype = Object.create(Action);
BimapAction.prototype.name = 'bimap';
BimapAction.prototype.toString = bimapperActionToString;
BimapAction.prototype.resolved = mapRight;
BimapAction.prototype.rejected = function BimapAction$rejected(x){
  return mapWith(this.lmapper, reject, x);
};

export function ChainAction(mapper){ this.mapper = mapper }
ChainAction.prototype = Object.create(Action);
ChainAction.prototype.name = 'chain';
ChainAction.prototype.toString = mapperActionToString;
ChainAction.prototype.resolved = chainActionHandler;

export function MapRejAction(mapper){ this.mapper = mapper }
MapRejAction.prototype = Object.create(Action);
MapRejAction.prototype.name = 'mapRej';
MapRejAction.prototype.toString = mapperActionToString;
MapRejAction.prototype.rejected = function MapRejAction$rejected(x){
  return mapWith(this.mapper, reject, x);
};

export function ChainRejAction(mapper){ this.mapper = mapper }
ChainRejAction.prototype = Object.create(Action);
ChainRejAction.prototype.name = 'chainRej';
ChainRejAction.prototype.toString = mapperActionToString;
ChainRejAction.prototype.rejected = chainActionHandler;

export function SwapAction(){}
SwapAction.prototype = Object.create(Action);
SwapAction.prototype.name = 'swap';
SwapAction.prototype.rejected = Action.resolved;
SwapAction.prototype.resolved = Action.rejected;

export function FoldAction(lmapper, rmapper){ this.lmapper = lmapper; this.rmapper = rmapper }
FoldAction.prototype = Object.create(Action);
FoldAction.prototype.name = 'fold';
FoldAction.prototype.toString = bimapperActionToString;
FoldAction.prototype.resolved = mapRight;
FoldAction.prototype.rejected = function FoldAction$rejected(x){
  return mapWith(this.lmapper, resolve, x);
};

export function FinallyAction(other){ this.other = other }
FinallyAction.prototype = Object.create(Action);
FinallyAction.prototype.name = 'finally';
FinallyAction.prototype.toString = otherActionToString;
FinallyAction.prototype.rejected = function FinallyAction$rejected(x){
  return this.other._and(new Rejected(x));
};
FinallyAction.prototype.resolved = function FinallyAction$resolved(x){
  return this.other._map(function FoldAction$resolved$mapper(){ return x });
};
FinallyAction.prototype.cancel = function FinallyAction$cancel(){
  this.other._interpret(noop, noop, noop)();
};

export function AndAction(other){ this.other = other }
AndAction.prototype = Object.create(Action);
AndAction.prototype.name = 'and';
AndAction.prototype.toString = otherActionToString;
AndAction.prototype.resolved = returnOther;

export function OrAction(other){ this.other = other }
OrAction.prototype = Object.create(Action);
OrAction.prototype.name = 'or';
OrAction.prototype.toString = otherActionToString;
OrAction.prototype.rejected = returnOther;

export function ParallelApAction(other){ this.other = other }
ParallelApAction.prototype = Object.create(ApAction.prototype);
ParallelApAction.prototype.name = '_parallelAp';
ParallelApAction.prototype.toString = otherActionToString;
ParallelApAction.prototype.run = function ParallelApAction$run(early){
  return new ParallelApActionState(early, this.other);
};

export function RaceAction(other){ this.other = other }
RaceAction.prototype = Object.create(Action);
RaceAction.prototype.name = 'race';
RaceAction.prototype.toString = otherActionToString;
RaceAction.prototype.run = function RaceAction$run(early){
  return new RaceActionState(early, this.other);
};

export function BothAction(other){ this.other = other }
BothAction.prototype = Object.create(Action);
BothAction.prototype.name = 'both';
BothAction.prototype.toString = otherActionToString;
BothAction.prototype.resolved = function BothAction$resolved(x){
  return this.other._map(function BothAction$resolved$mapper(y){ return [x, y] });
};
BothAction.prototype.run = function BothAction$run(early){
  return new BothActionState(early, this.other);
};

export function ParallelApActionState(early, other){
  var _this = this;
  _this.other = new Eager(other);
  _this.cancel = _this.other._interpret(
    function ParallelApActionState$rec(x){ early(new Crashed(x), _this) },
    function ParallelApActionState$rej(x){ early(new Rejected(x), _this) },
    noop
  );
}

ParallelApActionState.prototype = Object.create(ParallelApAction.prototype);

export function RaceActionState(early, other){
  var _this = this;
  _this.other = new Eager(other);
  _this.cancel = _this.other._interpret(
    function RaceActionState$rec(x){ early(new Crashed(x), _this) },
    function RaceActionState$rej(x){ early(new Rejected(x), _this) },
    function RaceActionState$res(x){ early(new Resolved(x), _this) }
  );
}

RaceActionState.prototype = Object.create(RaceAction.prototype);

export function BothActionState(early, other){
  var _this = this;
  _this.other = new Eager(other);
  _this.cancel = _this.other._interpret(
    function BothActionState$rec(x){ early(new Crashed(x), _this) },
    function BothActionState$rej(x){ early(new Rejected(x), _this) },
    noop
  );
}

BothActionState.prototype = Object.create(BothAction.prototype);
