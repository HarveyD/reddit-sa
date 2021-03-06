export class InfoBox {
	constructor(selector, parentSelector, delay, animateFrom, animatePos) {
		this.selector = selector;
		this.parentSelector = parentSelector;
		this.animationDelay = delay;
		this.animateFrom = animateFrom;
		this.animatePos = animatePos;
	}

	updateBody(data) {
		$(`${this.getClassSelector} .body`).text(data);
	}

	animate() {
		setTimeout(() => {
			$(this.getClassSelector).css(this.animateFrom, `${this.animatePos}%`)
		}, this.animationDelay);
	}

	resetPos() {
		$(this.getClassSelector).css(this.animateFrom, `100%`)
	}
	
	get getClassSelector() {
		return `.${this.selector}`;
	}

	get getParentClassSelector() {
		return `.${this.parentSelector}`;
	}
}

export class SquareBox extends InfoBox {
	constructor(selector, parentSelector, animationDelay, animateFrom, animatePos, icon) {
		super(selector, parentSelector, animationDelay, animateFrom, animatePos);
		this.icon = icon;
	}

	generateHtmlAndCss() {
		$(this.getParentClassSelector).append(`
		<div class="${this.selector}" style="${this.animateFrom}: 100%">
			<div class="heading abs-center">
				<i class="fa ${this.icon}"></i>
			</div>

			<div class="body abs-center"></div>
		</div>`);
	}
}

export class RectangleBox extends InfoBox {
	constructor(selector, parentSelector, animationDelay, animateFrom, animatePos, title) {
		super(selector, parentSelector, animationDelay, animateFrom, animatePos);
		this.title = title;
	}

	generateHtmlAndCss() {
		$(this.getParentClassSelector).append(`
			<div class="${this.selector}" style="${this.animateFrom}: 100%">
				<div class="heading">
						${this.title}
				</div>
				<div class="body"></div>
			</div>
		`);
	}
}

export class ButtonBox extends InfoBox {
	constructor(selector, parentSelector, animationDelay, animateFrom, animatePos, title) {
		super(selector, parentSelector, animationDelay, animateFrom, animatePos);
		this.title = title;
	}

	generateHtmlAndCss() {
		$(this.getParentClassSelector).append(`
			<span id="reload"></span>
			<button class="${this.selector}" style="${this.animateFrom}: 100%">
				${this.title || ''}
			</button>
		`);
	}
}