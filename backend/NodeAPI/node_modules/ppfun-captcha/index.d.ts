/**
 * config captcha generation options
 */
declare class ConfigObject {
	/**
	 * default: true
	 * The length of the random string
	 */
	size?: number;
	/**
	 * width of captcha
	 */
	width?: number;
	/**
	 * height of captcha
	 */
	height?: number;
	/**
	 * captcha text size
	 */
	fontSize?: number;
	/**
	 * random character preset
	 */
	charPreset?: string;
  /**
   * default: 'black'
   * Stroke Style of svg path, can be color or none
   */
  stroke?: string;
  /**
   * default: 'none'
   * Fill Style of svg path, can be color or none
   */
  fill?: string;
	/**
	 * default: false
	 * if set to true, it will draw with light grey color
	 * use if you have a site with dark theme
	 * only active when color is set to false
	 */
	inverse?: boolean;
	/**
	 * default: ''
	 * filter out some characters
	 */
	ignoreChars?: string;
	/**
	 * default: white
	 * background color of svg image
	 */
	background?: string;
	/**
	 * default: +
	 * the math operator to use, "+", "-" or "+/-"
	 * if unknown operator passed defaults to "+/-"
	 */
	mathOperator?: string;
	/**
	 * default: 1
	 * min value of the math expression
	 */
	mathMin?: number;
	/**
	 * default: 9
	 * max value of the math expression
	 */
	mathMax?: number;
  /**
   * default: 0.5
   * changing line probabilities
   */
  truncateLineProbability?: number;
  /**
   * default: 0.5
   * changing line probabilities
   */
  truncateCurveProbability?: number;
  /**
   * default: 0.4
   * changing line probabilities
   */
  truncateCurvePositionMin?: number;
  /**
   * default: 0.6
   * changing line probabilities
   */
  truncateCurvePositionMax?: number;
  /**
   * default: 10.0
   * changing line probabilities
   */
  connectionPathDeviation?: number;
  /**
   * default: 0.2
   * changing line probabilities
   */
  nodeDeviation?: number;
}
/**
 * result of captcha generation
 */
interface CaptchaObj {
	/**
	 * the captcha text,
	 * store this in your session
	 */
	text: string,
	/**
	 * the svg image in string,
	 * set type of image/svg before send to client side
	 */
	data: string
}
/**
 * This method returns a object that has two props:
 * data: svg image string
 * text: captcha text
 * @param {ConfigObject} [options]
 * @return {CaptchaObj}
 */
export function create(options?: ConfigObject): CaptchaObj;
/**
 * This method returns a object that has two props:
 * data: svg image string
 * text: captcha text
 * note that this method generate a math expression
 * this means that text is the result of the math expression
 * @param {ConfigObject} [options]
 * @return {CaptchaObj}
 */
export function createMathExpr(options?: ConfigObject): CaptchaObj;
/**
 * Override the default font with your own
 * @param {string} url
 */
export function loadFont(url: string): void;
/**
 * captcha generation global setting
 */
export const options: ConfigObject;
/**
 * return a random string
 * @param {number} size
 * @return {string}
 */
export function randomText(size: number): string;
