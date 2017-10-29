$(document).ready(function() {
    const sentiment = require('sentiment');
    // https://www.reddit.com/r/malelivingspace/comments/79dgls/art_ideas_for_offcenter_bedroom_wall.json

    let totalScore = 0;
    let commentCount = 0;
    let title = '';
    let createdOn;

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
        createdOn = new Date(postData.created);
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
    }

    let displayResults = () => {
        $('.results-container').show();

        setTimeout(() => {
            $('.title').css('top', '0%');
        }, 1);

        setTimeout(() => {
            $('.comment-count').css('top', '33.33%');
        }, 1000);

        setTimeout(() => {
            $('.sentiment').css('top', '66.67%');
        }, 2000);

        $('.search-container').hide();
        $('.heading').hide();

        $('.title').text(title);
        $('.comment-count').text(`Total Comments: ${commentCount}`);
        $('.sentiment').text(`Average Sentiment: ${Math.round(totalScore/commentCount * 100)}%`);
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