export const errorLogTemplate = (e: Error) => `\x1b[31m${e.name} ${e.message}\x1b[0m`;

export function log(message, type: 'log' | 'warn' = 'log', toggle = true) {
	if (!toggle) { return; }
	console[type](message);
}

export const validationException = (algorithmType: string, message: string) => ({
   message: `\n\x1b[31m${message}\x1b[0m`,
   name: `\x1b[31m${algorithmType} Validation Exception${message ? ':' : ''}\x1b[0m`
});


export const floatRound = (value: number, precision: number, type: 'ceil' | 'floor' |'round') => {
   switch(type){
       case 'ceil': return Math.ceil(value * Math.pow(10, precision)) / Math.pow(10, precision)
       case 'floor': return Math.floor(value * Math.pow(10, precision)) / Math.pow(10, precision)
       case 'round': return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision)
   }
}