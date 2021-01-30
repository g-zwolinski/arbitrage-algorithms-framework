export function log(message, type: 'log' | 'warn' = 'log', toggle = true) {
	if (!toggle) { return; }
	console[type](message);
}

export const validationException = (algorithmType: string, message: string) => ({
   message,
   name: `${algorithmType} Validation Exception`
});