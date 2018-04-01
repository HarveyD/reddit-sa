import { Constants, Box, Container } from './constants';
import { InfoBox, SquareBox, RectangleBox, ButtonBox } from './info-box';

let sentiment = require('sentiment');

let RedditSA = (function () {
  let threadComments;
  let positiveScore;
  let negativeScore;
  let inProgress;
  let infoBoxes;

  let init = () => {
    threadComments = [];
    positiveScore = 0;
    negativeScore = 0;
    inProgress = false;

    Object.keys(infoBoxes).forEach(box => {
      infoBoxes[box].generateHtmlAndCss();
    });

    loadActions();
  }

  let loadBoxes = (boxes) => {
    infoBoxes = boxes;
  }

  let getData = function (url = Constants.RandomUrl, isRandomReload = false) {
    if (inProgress) {
      return;
    }

    inProgress = true;

    url === Constants.RandomUrl ?
      $('#random').html(`<i class="fa fa-refresh"></i>`) :
      $('#search').html(`<i class="fa fa-refresh"></i>`);

    (function httpGet() {
      $.getJSON(url, (threadData) => {
        if (threadData.error && threadData.error === 404) {
          return;
        }

        const postData = threadData[0].data.children[0].data;
        const commentData = threadData[1].data;

        if (hasOneOrNoComments(postData)) {
          httpGet();
          return;
        }

        $('#search').html('Analyse');
        $('#random').html('Random');

        populateInfoBoxes(postData);
        getCommentsAndScore(commentData);
        analyseCommentData();
        sortAndStripComments();
        displayResults(isRandomReload);
        postResults(postData, url);

        if (isRandomReload) {
          finishedReloadingRandom();
        }
      })
        .error(() => {
          $('#search').html('Analyse');
          $('#random').html('Random');
        })
        .done(() => {
          inProgress = false;
        });
    })();
  };

  let hasOneOrNoComments = (postData) => {
    return postData.num_comments <= 1
      ? true
      : false;
  }

  let populateInfoBoxes = (postData) => {
    setTitleSize(postData.title.length);
    infoBoxes[Box.Title].updateBody(postData.title);
    infoBoxes[Box.Subreddit].updateBody(postData.subreddit_name_prefixed);
    infoBoxes[Box.CommentCount].updateBody(postData.num_comments);
    infoBoxes[Box.Upvote].updateBody(postData.ups);
    infoBoxes[Box.CreatedDate].updateBody(new Date(parseFloat(postData.created_utc) * 1000).toDateString());
  }

  let setTitleSize = (titleSize) => {
    let fontClass = 'large';

    if (titleSize > 120) {
      fontClass = 'very-small';
    } else if (titleSize > 90) {
      fontClass = 'small';
    } else if (titleSize > 60) {
      fontClass = 'medium';
    }

    $(`${Container.Results.asSelector()} .title .body`)
      .removeClass('large very-small small medium')
      .addClass(fontClass);
  }

  let getCommentsAndScore = (comments) => {
    comments.children.forEach((comment) => {
      if (!comment || !comment.data || !comment.data.body) {
        return;
      }

      let commentData = comment.data.body;

      if (comment.data.replies.data) {
        getCommentsAndScore(comment.data.replies.data);
      }

      const sentimentResult = sentiment(commentData);

      comment.sentimentComparative = sentimentResult.comparative;
      comment.sentimentScore = sentimentResult.score;
      threadComments.push(comment);
    });
  }

  let analyseCommentData = () => {
    let positiveCount = 0;
    let negativeCount = 0;

    threadComments.forEach(comment => {
      if (comment.sentimentComparative > 0) {
        positiveCount += 1;
      } else if (comment.sentimentComparative < 0) {
        negativeCount += 1;
      }
    });

    const commentCount = threadComments.length;

    positiveScore = Math.round((positiveCount / commentCount) * 100);
    negativeScore = Math.round((negativeCount / commentCount) * 100);
  }

  let sortAndStripComments = () => {
    threadComments = threadComments.map((commentData) => {
      const comment = commentData.data;
      return {
        author: comment.author,
        body: comment.body,
        body_html: comment.body_html,
        created: comment.created,
        created_utc: comment.created_utc,
        id: comment.id,
        link_id: comment.link_id,
        name: comment.name,
        parent_id: comment.parent_id,
        permalink: comment.permalink,
        score: comment.score,
        subreddit: comment.subreddit,
        subreddit_id: comment.subreddit_id,
        subreddit_name_prefixed: comment.subreddit_name_prefixed,
        ups: comment.ups,
        sentimentComparative: commentData.sentimentComparative,
        sentimentScore: commentData.sentimentScore
      }
    });

    threadComments.sort((a, b) => {
      return a.sentimentComparative - b.sentimentComparative;
    });
  };

  let displayResults = (isRandomReload) => {
    $(Container.Main.asSelector()).hide();
    $(Container.Results.asSelector()).show();

    infoBoxes[Box.PositiveSentiment].updateBody('0%');
    infoBoxes[Box.NegativeSentiment].updateBody('0%');

    Object.keys(infoBoxes).forEach(box => {
      infoBoxes[box].animate();
    });

    const animationDelay = isRandomReload
      ? 750
      : 2500;

    setTimeout(() => {
      animateSentimentResult([
        { 
          score: positiveScore,
          infoBox: infoBoxes[Box.PositiveSentiment],
          colorClass: 'positive' 
        },
        {
          score: negativeScore,
          infoBox: infoBoxes[Box.NegativeSentiment],
          colorClass: 'negative'
        }
      ]);
    }, animationDelay);
  };

  let postResults = (postInfo, url) => {
    const body = {
      searchId: {
        postId: postInfo.id,
        userName: ''
      },
      searchDetails: postInfo,
      positiveComments: threadComments
        .slice(-10)
        .reverse()
        .filter(c => { return c.sentimentComparative > 0 }),
      negativeComments: threadComments
        .slice(0, 10)
        .filter(c => { return c.sentimentComparative < 0 }),
      positivePercent: positiveScore,
      negativePercent: negativeScore,
      searchQuery: {
        wasRandom: url === Constants.RandomUrl ? true : false,
        wasSuggested: false,
        searchInput: $('#search-input').val()
      }
    };

    // $.post("/api/reddit-sa", body);
  }

  let finishedReloadingRandom = () => {
    $('#reload')
      .css("width", '0px')
      .css("height", '0px');
  }

  let animateSentimentResult = (animationList, currentAnimationIndex = 0) => {
    const currentAnimation = animationList[currentAnimationIndex];
    
    if (!currentAnimation) {
      throw new Error('Incorrect Infobox Provided to be animated');
    }

    const percentage = currentAnimation.score;

    let currentPercent = 0;
    let currentSpeed = 25;

    $(currentAnimation.infoBox.selector.asSelector()).addClass(currentAnimation.colorClass);

    (function animate() {
      setTimeout(() => {
        currentPercent += 1;

        const completion = currentPercent / percentage;
        currentSpeed = completion * 100;

        currentAnimation.infoBox.updateBody(`${currentPercent}%`);

        if (completion < 1 && !inProgress) {
          animate();
        } else if (currentAnimationIndex < animationList.length - 1) {
          animateSentimentResult(animationList, ++currentAnimationIndex);
        }
      }, currentSpeed);
    })();
  };

  let loadActions = () => {
    $('#search-input').on('input', () => {
      let url = $('#search-input').val();

      const res = parseInput(url);

      if (res) {
        $('#input-icon')
          .removeClass('invalid fa-times')
          .addClass('valid fa-check')

        $('#search-input')
          .removeClass('invalid')
          .addClass('valid');
      } else {
        $('#input-icon')
          .removeClass('valid fa-check')
          .addClass('invalid fa-times')

        $('#search-input')
          .removeClass('valid')
          .addClass('invalid');
      }
    });

    $('#search').click(() => {
      let url = $('#search-input').val();

      if (!url) {
        return;
      }

      const jsonUrl = parseInput(url);

      if (!jsonUrl) {
        return;
      }

      getData(jsonUrl);
    });

    let parseInput = (input) => {
      const redditRegexCode = /^\w{6}$/;
      const redditRegexUrl = /^(https|http):\/\/(www)?.reddit.com\/r\/\w*\//;

      if (redditRegexCode.exec(input)) {
        return `${Constants.redditCodeUrl}${input}.json`;
      } else if (redditRegexUrl.exec(input)) {
        return input + '.json';
      }

      return null;
    };

    $('#random').click(() => {
      getData();
    });

    $(Box.Search.asSelector()).click(() => {
      $(Container.Results.asSelector()).css('bottom', '100%');
      $(Container.Main.asSelector()).show();

      setTimeout(() => {
        resetToMenu();
      }, 2000);
    });

    let resetToMenu = () => {
      resetState();

      $(Container.Results.asSelector())
        .hide()
        .css('bottom', '0%');

      Object.keys(infoBoxes).forEach(box => {
        infoBoxes[box].resetPos();
      });
    }

    $(Box.Random.asSelector()).click(() => {
      getData(Constants.RandomUrl, true);
      animateReloadRandom();
    });

    let animateReloadRandom = () => {
      resetState();

      $('#reload')
        .css("width", `${$(window).height() * Constants.ReloadFactor}px`)
        .css("height", `${$(window).height() * Constants.ReloadFactor}px`);
    };

    let resetState = () => {
      threadComments = [];
      positiveScore = 0;
      negativeScore = 0;

      $(Box.PositiveSentiment.asSelector()).removeClass('positive');
      $(Box.NegativeSentiment.asSelector()).removeClass('negative');
    }

    /* Todo: Add details on top 10 negative and positive comments
    $(Box.PositiveSentiment.asSelector()).click(() => {
      populatePositiveComments();
    });

    let populatePositiveComments = () => {
      resultState = 'positive-comments';
      
      const positiveComments = threadComments
        .slice(-10)
        .reverse()
        .filter(c => { return c.sentimentComparative > 0 });

      $(Box.PositiveSentiment.getClassSelector)
        .addClass('fullscreen');
    }
    */
  }

  let publicAPI = {
    init: init,
    loadBoxes: loadBoxes,
    loadActions: loadActions
  }

  return publicAPI;
})();

RedditSA.loadBoxes({
  [Box.Title]: new RectangleBox(Box.Title, Container.Results, 1, 'bottom', 85, ''),
  [Box.Subreddit]: new RectangleBox(Box.Subreddit, Container.Results, 500, 'bottom', 75, ''),
  [Box.CommentCount]: new SquareBox(Box.CommentCount, Container.Information, 500, 'right', 0, 'fa-comments'),
  [Box.Upvote]: new SquareBox(Box.Upvote, Container.Information, 1000, 'right', 33.33, 'fa-arrow-circle-up'),
  [Box.CreatedDate]: new SquareBox(Box.CreatedDate, Container.Information, 1500, 'right', 66.67, 'fa-calendar'),
  [Box.PositiveSentiment]: new RectangleBox(Box.PositiveSentiment, Container.Results, 2000, 'top', 50, 'Positive Sentiment'),
  [Box.NegativeSentiment]: new RectangleBox(Box.NegativeSentiment, Container.Results, 2250, 'top', 70, 'Negative Sentiment'),
  [Box.Search]: new ButtonBox(Box.Search, Container.Buttons, 2500, 'right', 50, 'Search'),
  [Box.Random]: new ButtonBox(Box.Random, Container.Buttons, 2500, 'left', 50, 'Random Post')
});

$(document).ready(function () {
  RedditSA.init();
});

String.prototype.asSelector = function() {
    return `.${this}`;
}