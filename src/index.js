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
import "rxjs/add/observable/combineLatest";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/takeWhile";

const startButton = document.querySelector('#start');
const halfButton = document.querySelector('#half');
const quarterButton = document.querySelector('#quarter');
const stopButton = document.querySelector("#stop");
const resetButton = document.querySelector("#reset");
const input = document.querySelector("#input");
//creates sequence of events over time

/*Observable.fromEvent(startButton, "click")
  .subscribe((event) => {
    Observable.interval(1000)
      .subscribe((x) => console.log(x));
  });*/
/* Although this works, do not use multiple subscribe blocks nested inside of each other
* for 1. you will lose this ability to save this stream and reuse.
*     2. multiple click will recreate many interval. The former interval will continue to emit events
* */

// on button click i want to switch over to interval observer
// every time i click on start button, the subscriber is going to receive events from
// new interval and clear the former stream
// $ => Observable

const startEvent$ = Observable.fromEvent(startButton, "click");
const halfEvent$ = Observable.fromEvent(halfButton, "click");
const quarterEvent$ = Observable.fromEvent(quarterButton, "click");
const stopEvent$ = Observable.fromEvent(stopButton, "click");
const resetEvent$ = Observable.fromEvent(resetButton, "click");
const input$ = Observable.fromEvent(input, "input");
const interval$ = Observable.interval(1000);

//**************** stopping a stream with takeUntil ********************//

/*const subscription = interval$.subscribe((x)=> console.log(x));
const stopEvent$ = Observable.fromEvent(stopButton, "click");
stopEvent$.subscribe((event) => {
  subscription.unsubscribe();
});*/
// use takeUntil operator to stop a stream instead of subscribing to new stopEvent$ and
// then un subscribing inside subscribe function.

const intervalThatStops$ = interval$
  // stopping s stream with takUntill
  .takeUntil(stopEvent$);
//intervalThatStops$.subscribe((x) => console.log(x));

//*************** starting a new stream with switchMap ***************//

//startEvent$
// starting a stream with switchMap and clear previous stream
// or use .switchMap((event)=>interval$); with arrow function
/*.switchMapTo(intervalThatStops$)
 .subscribe((x)=>console.log(x));*/

//******************* update data with scan *************************//
/*let count = 0;
startEvent$
  .switchMapTo(intervalThatStops$)
  .subscribe((x)=>{
    console.log(count++)
  });*/
// scan -  to to be able to continue stream count instead in instead of using global state
/*startEvent$
  .switchMapTo(intervalThatStops$)
  // the proper way to gather and collect data - scan - similar to array reduce
  .scan((acc)=>{
    return { count: acc.count + 1}
  }, {count: 0})
  .subscribe((x)=>console.log(x));*/

//***************** displaying initial data with startWith *****************//

/*startEvent$
  .switchMapTo(intervalThatStops$)
  // if we want scan pipeline to fire one time, instead of waiting for startEvent$ to trigger the stream flow
  .startWith({count: 0})
  // the proper way to gather and collect data - scan - similar to array reduce
  .scan((acc)=>{
    return { count: acc.count + 1}
  }) // startWith will set the initial value of scan acc
  .subscribe((x)=>console.log(x));*/

/******************** changing behaviour with mapTo **********************/

// mapTo - make scan flexible enough to switch between different behavior on it own

const data  = { count: 0};
//Behaviour - 1
const incFn = (acc) => ( {count: acc.count + 1} );

//Behavior - 2
const resetFn = (acc) => data;

/*startEvent$
  .switchMapTo(intervalThatStops$)
  // map will pass currFn to scan
  .mapTo(incFn)
  // if we want scan pipeline to fire one time, instead of waiting for startEvent$ to trigger the stream flow
  .startWith(data)
  // the proper way to gather and collect data - scan - similar to array reduce
  // without mapTo, scan w- currFn would just log th tick - 0,1,2,3...
  //.scan((acc, curr)=> curr)
  .scan((acc, currFn) => currFn(acc)) // startWith will set the initial value of scan acc
  .subscribe((x)=>console.log(x));*/

/********************* handling multiple stream | logical OR ****************************************/
//  we want to pass interval stream when start button is click and reset stream when reset button is clicked
// merge operator is like logical or, which passes events from either of the screams
// mapTo will change the behavior of scan currFn
// switchMap will start new stream and clear the triggering stream

const incOrReset$ = Observable.merge(
  intervalThatStops$.mapTo(incFn),
  resetEvent$.mapTo(resetFn)
);

/*startEvent$.
  switchMapTo(incOrReset$)
    .startWith(data)
    .scan((acc, curr) => curr(acc))
    .subscribe((x) => console.log(x));*/

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
    .mapTo(incFn),
  resetEvent$.mapTo(resetFn)
);

/*starters$
  .switchMap(intervalActions)
  .startWith(data)
  .scan((acc, curr) => curr(acc))
  .subscribe((x) => console.log(x));*/

/**************************** transform data with map *************************/

const inputText$ = input$.map(event => event.target.value);

/************************* combine streams with combineLatest **********************/

const timer$ = starters$
  .switchMap(intervalActions)
  .startWith(data)
  .scan((acc, curr) => curr(acc));

// combine latest value of timer sream and input stream with combineLatest
/*Observable.combineLatest(timer$, inputText$, (timer, input) => ({ count: timer.count, text: input }))
  // the third argument in above function is equivalent to .map(array => ({count: array[0].count, text: array[1]}))
  .subscribe(x => console.log(x));*/

/******************** adding conditional logic with filter ************************/

/*Observable.combineLatest(
  timer$,
  inputText$,
  (timer, input) => ({ count: timer.count, text: input }))
  .filter((data) => data.count === parseInt(data.text))
  .subscribe(x => console.log(x));*/

/******************* completing a stream with take while **********************/

Observable.combineLatest(
  timer$,
  inputText$,
  (timer, input) => ({count: timer.count, text: input}))
  .takeWhile(data => data.count <= 3)
  //filters don't complete the stream. Filter just tells our streams which things to push through
  .filter((data) => data.count === parseInt(data.text))
  .subscribe(
    // next: called on every tick
    x => console.log(x),
    err => console.log(err),
    () => console.log("Stream is complete | Game Over")
  );