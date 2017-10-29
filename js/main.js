$(document).ready(function() {
    const sentiment = require('sentiment');

    let infoBoxes = [
        new RectangleBox('title', 'results-container', 1, 'bottom', 85,  ''),
        new SquareBox('comment-count', 'information-container', 500, 'right', 0, 'fa-comments'),
        new SquareBox('upvotes', 'information-container', 1000, 'right', 33.33, 'fa-arrow-circle-up'),
        new SquareBox('created', 'information-container', 1500, 'right', 66.66, 'fa-calendar'),
        new RectangleBox('sentiment', 'results-container', 2000, 'top', 50, '')
    ]

    let totalScore = 0;
    let commentCount = 0;
    let title = '';

    let getData = (url) => {
        $.getJSON(url, (threadData) => {
            getPostDetails(threadData[0]);
            getComments(threadData[1].data);
            displayResults();
        });
    };

    let getPostDetails = (data) => {
        const postData = data.data.children[0].data;
        title = postData.title;

        infoBoxes[0].updateBody(postData.title);
        
        infoBoxes[1].updateBody(postData.num_comments);
        infoBoxes[2].updateBody(postData.ups);
        infoBoxes[3].updateBody(new Date(postData.created).toDateString());
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
            totalScore += sentimentResult.score;
            commentCount += 1;
        });

        infoBoxes[4].updateBody(`Average Sentiment: ${Math.round(totalScore/commentCount * 100)}%`);
    }

    let displayResults = () => {
        $('.main-container').hide();
        $('.results-container').show();

        infoBoxes.forEach(infoBox => {
            infoBox.animate();
        });

        // setTimeout(() => {
        //     $('.title').css('top', '0%');
        // }, 1);

        // setTimeout(() => {
        //     $('.sentiment').css('top', '66.67%');
        // }, 2000);
    };

    $('#search').click(() => {
        let url = $('#search-input').val();
        
        if (!url) {
            return;
        }

        url += '.json';

        getData(url);
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