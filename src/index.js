import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/fromEvent";
import "rxjs/add/observable/interval";
import "rxjs/add/operator/switchMap";
import "rxjs/add/operator/switchMapTo";
import "rxjs/add/operator/takeUntil";
import "rxjs/add/operator/do";
import "rxjs/add/operator/scan";
import "rxjs/add/operator/startWith";
import "rxjs/add/operator/mapTo";
import "rxjs/add/observable/merge";
import "rxjs/add/operator/map";
import "rxjs/add/operator/combineLatest";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/takeWhile";
import "rxjs/add/operator/reduce";
import "rxjs/add/operator/withLatestFrom";
import "rxjs/add/operator/repeat";
import "rxjs/add/operator/share";

const startButton = document.querySelector('#start');
const halfButton = document.querySelector('#half');
const quarterButton = document.querySelector('#quarter');
const stopButton = document.querySelector("#stop");
const resetButton = document.querySelector("#reset");
const input = document.querySelector("#input");
const score = document.querySelector("#score");

const startEvent$ = Observable.fromEvent(startButton, "click");
const halfEvent$ = Observable.fromEvent(halfButton, "click");
const quarterEvent$ = Observable.fromEvent(quarterButton, "click");
const stopEvent$ = Observable.fromEvent(stopButton, "click");
const resetEvent$ = Observable.fromEvent(resetButton, "click");
const input$ = Observable.fromEvent(input, "input");
const interval$ = Observable.interval(1000);

//**************** stopping a stream with takeUntil ********************//
// use takeUntil operator to stop a stream instead of subscribing to new stopEvent$ and
// then un subscribing inside subscribe function.

const intervalThatStops$ = interval$
  // stopping s stream with takUntil
  .takeUntil(stopEvent$);

/******************** changing behaviour with mapTo **********************/

// mapTo - make scan flexible enough to switch between different behavior on it own

const data  = { count: 0};
//Behaviour - 1
const incFn = (acc) => ( {count: acc.count + 1} );

//Behavior - 2
const resetFn = (acc) => data;

/********************* handling multiple stream | logical OR ****************************************/
//  we want to pass interval stream when start button is click and reset stream when reset button is clicked
// merge operator is like logical or, which passes events from either of the screams
// mapTo will change the behavior of scan currFn

const incOrReset$ = Observable.merge(
  intervalThatStops$.mapTo(incFn),
  resetEvent$.mapTo(resetFn)
);

/************************ implement new feature by composing stream *********************/

const starters$ = Observable.merge(
  // switchMap will get map to time as argument
  startEvent$.mapTo(1000),
  halfEvent$.mapTo(500),
  quarterEvent$.mapTo(250)
);

const intervalActions = (time) => Observable.merge(
  Observable.interval(time)
    .takeUntil(stopEvent$)
    // mapTo will pass currFn to scan
    .mapTo(incFn),
  resetEvent$.mapTo(resetFn)
);

/**************************** transform data with map *************************/

const inputText$ = input$.map(event => event.target.value);

/************************* combine streams with combineLatest **********************/

const timer$ = starters$
  // switchMap will start new stream and clear the triggering stream
  .switchMap(intervalActions)
  // startWith will set the initial value of scan acc
  .startWith(data)
  // scan -  to to be able to continue stream count instead of using global state
  // the proper way to gather and collect data - scan - similar to array reduce
  // without mapTo, scan - currFn would just log th tick - 0,1,2,3...
  .scan((acc, curr) => curr(acc));

// combine latest value of timer stream and input stream with combineLatest
/* Observable.combineLatest(timer$, inputText$, (timer, input) => ({ count: timer.count, text: input }))
  // the third argument in above function is equivalent to .map(array => ({count: array[0].count, text: array[1]}))
  .subscribe(x => console.log(x));*/

/********************************* sharing stream with share ************************************/

starters$ // stream of event that don't complete, so we don't have to apply repeat
  .subscribe( () => {
    input.value = "";
    input.focus();
    score.innerHTML = "";
  });

resetEvent$.subscribe(() => {
  input.value = "";
  input.focus();
  score.innerHTML = "";
});

const runningGame = timer$
  // logging a stream with do
 // do - side effect
  .do((x) => console.log("Timer :",x)) // side effect
  //completing a stream with take while
  .takeWhile(data => data.count <= 3)
  // takeWhile will complete stream at tick 4
  //.combineLatest(
  //combineLatest waits for complete event from both timer and input.
  // But input never completes
  // competing stream withLatestFrom
  .withLatestFrom(
    // timer will take latest value from input, but it wont wait for the the input to complete
    inputText$.do((x) => console.log("Input :",x)),
    (timer, input) => ({count: timer.count, text: input}))
  // do -> something that is going to happen outside the stream
  .do((x) => console.log("withLatestFrom :",x))
  // this is the checkpoint before match
  // by default each subscriber has separate execution context. So we see multiple logs for same tick
  // sharing stream with share
  .share(); // share same running game execution to all subscribers

// new side effect
runningGame
  .repeat() // we need to repeat on input value as well
  .subscribe(() => input.value = "");

runningGame
  // adding conditional logic with filter
  //filters don't complete the stream. Filter just tells our streams which things to push through
  .filter((data) => data.count === parseInt(data.text))
  // Handling a complete stream with reduce
  // calculate final score with reduce
  // reduce collects data until stream hits complete
  .reduce((acc, curr) => acc + 1, 0) // acc  -> tick, data from filter is passed with curr
  // reduce operator runs on complete
  // subscribe block is now waiting for complete event, final output
  // resubscribing to a stream with repeat
  .repeat() // usually used before subscribe block
  // resubscribe on complete event from reduce but does not completes subscriber
  .subscribe(
    // next: called on every tick
    x => {
      score.innerHTML = x;
      console.log("Total score :", x);
    },
    err => console.log(err),
    () => console.log("Game Over !!!") // after using repeat, we dont get complete event
  );