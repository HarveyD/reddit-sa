$(document).ready(function() {
    const sentiment = require('sentiment');

    let infoBoxes = [
        new RectangleBox('title', 'results-container', 1, 'bottom', 85,  ''),
        new RectangleBox('subreddit', 'results-container', 500, 'bottom', 75,  ''),
        new SquareBox('comment-count', 'information-container', 500, 'right', 0, 'fa-comments'),
        new SquareBox('upvotes', 'information-container', 1000, 'right', 33.33, 'fa-arrow-circle-up'),
        new SquareBox('created', 'information-container', 1500, 'right', 66.67, 'fa-calendar'),
        new RectangleBox('sentiment', 'results-container', 2000, 'top', 50, ''),
        new ButtonBox('search-again', 'buttons-container', 2500, 'right', 50, 'Search'),
        new ButtonBox('feeling-lucky', 'buttons-container', 2500, 'left', 50, 'Random Post')
    ]

    let totalScore = 0;
    let commentCount = 0;

    let randomUrl = 'https://www.reddit.com/random/.json';

    let highestScore = Number.MIN_SAFE_INTEGER;
    let mostPositive = '';

    let lowestScore = Number.MAX_SAFE_INTEGER;
    let mostNegative = '';

    let getData = (url = randomUrl) => {
        $('#search').html(`<i class="fa fa-refresh"></i>`);

        $.getJSON(url, (threadData) => {
            if (threadData.error && threadData.error === 404) {
                return; 
            }

            const postData = threadData[0].data.children[0].data;
            const commentData = threadData[1].data;

            if (!hasComments(postData)) {
                return getData();
            }
        
            populateInfoBoxes(postData);
            getComments(commentData);
            infoBoxes[5].updateBody(`Average Sentiment: ${Math.round(totalScore/commentCount * 100)}%`);
            
            displayResults();
        })
        .done(() => {
            $('#search').html('Analyse');
        });
    };

    let hasComments = (postData) => {
        if (postData.num_comments > 0) {
            return true;
        }

        return false;
    }

    let populateInfoBoxes = (postData) => {
        title = postData.title;

        infoBoxes[0].updateBody(postData.title);
        infoBoxes[1].updateBody(postData.subreddit_name_prefixed);
        infoBoxes[2].updateBody(postData.num_comments);
        infoBoxes[3].updateBody(postData.ups);
        infoBoxes[4].updateBody(new Date(postData.created_utc).toDateString());
    }

    let getComments = (comments) => {
        comments.children.forEach((comment) => {
            if (!comment) {
                return;
            }

            const commentData = comment.data.body;

            if (!commentData) {
                return;
            }

            if (comment.data.replies.data) {
                getComments(comment.data.replies.data);
            }

            const sentimentResult = sentiment(commentData);

            if (sentimentResult.score > highestScore) {
                highestScore = sentimentResult.score;
                mostPositive = commentData;
            }

            if (sentimentResult.score < lowestScore) {
                lowestScore = sentimentResult.score;
                mostNegative = commentData;
            }

            totalScore += sentimentResult.score;
            commentCount += 1;
        });
    }

    let displayResults = () => {
        $('.main-container').hide();
        $('.results-container').show();

        infoBoxes.forEach(infoBox => {
            infoBox.animate();
        });

        console.log(mostPositive);
        console.log(mostNegative);
    };

    $('#search').click(() => {
        let url = $('#search-input').val();
        
        if (!url) {
            return;
        }

        url += '.json';

        getData(url);
    });

    $('#random').click(() => {
        getData();
    });

    $('.feeling-lucky').click(() => {
        getData();
    });
});

class InfoBox {
    constructor(selector, parentSelector, delay, animateFrom, animatePos) {
        this.selector = selector;
        this.parentSelector = parentSelector;
        this.animationDelay = delay;
        this.animateFrom = animateFrom;
        this.animatePos = animatePos;
    }

    updateBody(data) {
        $(`.${this.selector} .body`).text(data);
    }

    animate() {
        setTimeout(() => {
            $(`.${this.selector}`).css(this.animateFrom, `${this.animatePos}%`)
            
        }, this.animationDelay);
    }
}

class SquareBox extends InfoBox {
    constructor(selector, parentSelector, animationDelay, animateFrom, animatePos, icon) {
        super(selector, parentSelector, animationDelay, animateFrom, animatePos);
        this.icon = icon;

        this.generateHtmlAndCss();
    }

    generateHtmlAndCss() {
        $(`.${this.parentSelector}`).append(`
        <div class="${this.selector}" style="${this.animateFrom}: 100%">
            <div class="heading abs-center">
                <i class="fa ${this.icon}"></i>
            </div>

            <div class="body abs-center">
            </div>
        </div>`);
    }
}

class RectangleBox extends InfoBox {
    constructor(selector, parentSelector, animationDelay, animateFrom, animatePos, title) {
        super(selector, parentSelector, animationDelay, animateFrom, animatePos);
        this.title = title;

        this.generateHtmlAndCss();
    }

    generateHtmlAndCss() {
        $(`.${this.parentSelector}`).append(`
            <div class="${this.selector}" style="${this.animateFrom}: 100%">
                <span class="body"></span>
            </div>
        `);
    }
}

class ButtonBox extends InfoBox {
    constructor(selector, parentSelector, animationDelay, animateFrom, animatePos, title) {
        super(selector, parentSelector, animationDelay, animateFrom, animatePos);
        this.title = title;

        this.generateHtmlAndCss();
    }

    generateHtmlAndCss() {
        $(`.${this.parentSelector}`).append(`
            <button class="${this.selector}" style="${this.animateFrom}: 100%">
                ${this.title}
            </button>
        `);
    }
}