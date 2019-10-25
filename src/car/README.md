# CAR 🚗 🚗 🚗

## Command Line Arguments Reader

Reads command line arguments and validates them based on a defined list

## Defined List

CAR is a function that takes 3 arguments, two of those are optional.
The first one is a defined list used to match to arguments from the Terminal.

```js
const CAR = require('@makever/CAR');

const arguments = CAR({
  '-h': {
    flag: true
  },
  '-v': {
    flag: true // flag
  },
  '-c': {
    var: true,
    default: 'chicken-wolf' // mixed flag
  },
  '-o': {
    var: true // variable
  }
});

console.log(arguments);

// { '-c': '<input-value>|<default>', '-o': '<input-value>', '-v': true, '-h': true }
```

## Options

- Flags. For example: ```command -h``` The argument ```-h``` is read and set as true by CAR.
A key on the defined list defined as a flag is set to true when it's read from the console.
Flags will always be true.

- Vars. For example: ```command -o value``` The argument ```-o``` is defined as a var on the defined list, so CAR will expect
the value after it to be its value. After validation CAR spits out ```-o``` as ```{'-o': 'value'}```

- Vars with default or Mixed flags. ```command [ -c | -c=true | -c false ]``` CAR will read mixed flags as flags from the terminal and define them
by thei default value or just use the input value read. CAR will generate ```{ '-c': '<input-value>|<default>' }```
Mixed flags allow for flags with different values, they are not always true.

## License

ISC License [ISC](https://opensource.org/licenses/ISC)

## Author

&copy; 2019 Verdexdesign
