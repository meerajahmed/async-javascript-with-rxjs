import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/fromEvent";
import "rxjs/add/observable/interval";
import "rxjs/add/operator/switchMap";
import "rxjs/add/operator/switchMapTo";
import "rxjs/add/operator/takeUntil";
import "rxjs/add/operator/do";
import "rxjs/add/operator/scan";
import "rxjs/add/operator/startWith"

const startButton = document.querySelector('#start');
const stopButton = document.querySelector("#stop");
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
// new interval and close the former one
// $ => Observable

const startEvent$ = Observable.fromEvent(startButton, "click");
const stopEvent$ = Observable.fromEvent(stopButton, "click");
const interval$ = Observable.interval(1000);

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

//startEvent$
// starting a stream with switchMap and close previous stream
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

startEvent$
  .switchMapTo(intervalThatStops$)
  // if we want scan to fire one time, instead of waiting for startEvent$ to trigger the stream flow
  .startWith({count: 0})
  // the proper way to gather and collect data - scan - similar to array reduce
  .scan((acc)=>{
    return { count: acc.count + 1}
  }) // startWith will set the initial value of scan acc
  .subscribe((x)=>console.log(x));



