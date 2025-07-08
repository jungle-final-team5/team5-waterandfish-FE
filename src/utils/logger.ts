export const logger = {
  info: (message: string) => {
    console.log(message);
  },
  error: (message: string) => {
    console.error(message);
  },
  warning: (message: string) => {
    console.warn(message);
  },
  debug: (message: string) => {
    console.debug(message);
  }
}; 