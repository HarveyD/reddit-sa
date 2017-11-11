$(document).ready(function() {
    const sentiment = require('sentiment');

    const randomUrl = 'https://www.reddit.com/random/.json';
    const redditCodeUrl = 'https://www.reddit.com/'
    
    let threadComments = [];
    
    let positiveScore = 0;
    let negativeScore = 0;
    let inProgress = false;

    let infoBoxes = {
      'title': new RectangleBox('title', 'results-container', 1, 'bottom', 85,  ''),
      'subreddit': new RectangleBox('subreddit', 'results-container', 500, 'bottom', 75,  ''),
      'comment-count': new SquareBox('comment-count', 'information-container', 500, 'right', 0, 'fa-comments'),
      'upvotes': new SquareBox('upvotes', 'information-container', 1000, 'right', 33.33, 'fa-arrow-circle-up'),
      'created': new SquareBox('created', 'information-container', 1500, 'right', 66.67, 'fa-calendar'),
      'positive-sentiment': new RectangleBox('positive-sentiment', 'results-container', 2000, 'top', 50, 'Positive Sentiment'),
      'negative-sentiment': new RectangleBox('negative-sentiment', 'results-container', 2250, 'top', 70, 'Negative Sentiment'),
      'search-again': new ButtonBox('search-again', 'buttons-container', 2500, 'right', 50, 'Search'),
      'feeling-lucky': new ButtonBox('feeling-lucky', 'buttons-container', 2500, 'left', 50, 'Random Post')
    };

    $('#search-input').focus();

    let getData = (url = randomUrl, isRandomReload = false) => {
      if (inProgress) {
          return;
      }

      inProgress = true;
      
      url === randomUrl ?
          $('#random').html(`<i class="fa fa-refresh"></i>`) :
          $('#search').html(`<i class="fa fa-refresh"></i>`);
      
      (httpGet = () => {
        $.getJSON(url, (threadData) => {
          if (threadData.error && threadData.error === 404) {
            return; 
          }

          const postData = threadData[0].data.children[0].data;
          const commentData = threadData[1].data;

          if (hasNoComments(postData)) {
            return httpGet();
          }

          $('#search').html('Analyse');
          $('#random').html('Random');
      
          populateInfoBoxes(postData);
          getComments(commentData);
          analyseCommentData();
          sortComments();
          displayResults(isRandomReload);
          postResults(postData, url);

          if (isRandomReload) {
            finishedReloadingRandom();
          }
        })
        .error (() => {
            $('#search').html('Analyse');
            $('#random').html('Random');
        })
        .done (() => {
            inProgress = false;
        });

      })();
    };

    let hasNoComments = (postData) => {
      return postData.num_comments <= 0 ? true : false;
    }

    let populateInfoBoxes = (postData) => {
      infoBoxes['title'].updateBody(postData.title);
      infoBoxes['subreddit'].updateBody(postData.subreddit_name_prefixed);
      infoBoxes['comment-count'].updateBody(postData.num_comments);
      infoBoxes['upvotes'].updateBody(postData.ups);
      infoBoxes['created'].updateBody(new Date(parseFloat(postData.created_utc) * 1000).toDateString());
    }

    let getComments = (comments) => {
      comments.children.forEach((comment) => {
        if (!comment) {
          return;
        }

        let commentData = comment.data.body;

        if (!commentData) {
          return;
        }

        if (comment.data.replies.data) {
          getComments(comment.data.replies.data);
        }

        const sentimentResult = sentiment(commentData);

        comment.sentimentComparative = sentimentResult.comparative;
        comment.sentimentScore = sentimentResult.score;
        threadComments.push(comment);
      });
    }

    let sortComments = () => {
      threadComments.sort((a, b) => {
        return a.sentimentComparative - b.sentimentComparative;
      });
    };

    let analyseCommentData = () => {
      let positiveCount = 0;
      let negativeCount = 0;

      threadComments.forEach(comment => {
        if (comment.sentimentComparative > 0 ) {
          positiveCount += 1;
        } else if (comment.sentimentComparative < 0) {
          negativeCount += 1;
        }
      });
      // let totalScore = threadComments.reduce((acc, val) => {
      //   return acc + ((val.sentimentComparative / 5) * 100);
      // }, 0);

      const commentCount = threadComments.length;

      positiveScore = Math.round((positiveCount / commentCount) * 100);
      negativeScore = Math.round((negativeCount / commentCount) * 100);
    }

    let displayResults = (isRandomReload) => {
      $('.main-container').hide();
      $('.results-container').show();
      infoBoxes['positive-sentiment'].updateBody('0%');
      infoBoxes['negative-sentiment'].updateBody('0%');

      Object.keys(infoBoxes).forEach(box => {
        infoBoxes[box].animate();
      });

      const animationDelay = isRandomReload ? 750 : 2500;

      setTimeout(() => {
        animateSentimentResult([
          { score: positiveScore, selector: 'positive-sentiment', colorClass: 'positive' },
          { score: negativeScore, selector: 'negative-sentiment' , colorClass: 'negative'}
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
        negativeComments: threadComments.slice(0, 10),
        positiveComments: threadComments.slice(-10).reverse(),
        positivePercent: positiveScore,
        negativePercent: negativeScore,
        searchQuery: {
          wasRandom: url === randomUrl ? true : false,
          wasSuggested: false,
          searchInput: $('#search-input').val()
        }
      };

      $.post( "http://localhost:3000/api/reddit-sa", body, (res) => {
        console.log(res);
      });
    }

    let animateSentimentResult = (animationList, currentAnimationIndex = 0) => {
      const animationObj = animationList[currentAnimationIndex];
      const percentage = animationObj.score;
      const selector = animationObj.selector;

      let currentPercent = 0;
      let currentSpeed = 25;

      $(`.${selector}`).addClass(animationObj.colorClass);

      (animate = () => {
        setTimeout(() => {
          currentPercent += 1;

          const completion = currentPercent / percentage;
          currentSpeed = (completion) * 100;
          
          infoBoxes[selector].updateBody(currentPercent + '%');

          if (completion < 1 && !inProgress) {
            animate();
          } else if (currentAnimationIndex < animationList.length - 1 ) {
            animateSentimentResult(animationList, ++currentAnimationIndex);
          }
        }, currentSpeed);
      })();
    };

    $('#search-input').on('input', () => {
      let url = $('#search-input').val();

      const res = parseInput(url);

      if (res) {
        $('#input-icon')
          .removeClass('invalid')
          .removeClass('fa-times')
          .addClass('valid')
          .addClass('fa-check');

        $('#search-input')
          .removeClass('invalid')
          .addClass('valid');
      } else {
        $('#input-icon')
          .removeClass('valid')
          .removeClass('fa-check')
          .addClass('invalid')
          .addClass('fa-times');

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
        return `${redditCodeUrl}${input}.json`;
      } else if(redditRegexUrl.exec(input)) {
        return input+'.json';
      }

      return null;
    };

    $('#random').click(() => {
      getData();
    });

    $('.search-again').click(() => {
      $('.results-container').css('bottom', '100%');
      $('.main-container').show();

      setTimeout(() => {
        resetToMenu();
      }, 2000);
    });

    let resetToMenu = () => {
      resetState();

      $('.results-container')
        .hide()
        .css('bottom', '0%');

      Object.keys(infoBoxes).forEach(box => {
        infoBoxes[box].resetPos();
      });
    }

    $('.feeling-lucky').click(() => {
        getData(randomUrl, true);
        animateReloadRandom();
    });

    let animateReloadRandom = () => {
      resetState();
      
      $('#reload')
        .css("width", `${$(window).height() * 2.75}px`)
        .css("height", `${$(window).height() * 2.75}px`);
    };

    let resetState = () => {
      threadComments = [];
      totalScore = 0;
      positiveScore = 0;
      negativeScore = 0;

      $('.positive-sentiment').removeClass('positive')
      $('.negative-sentiment').removeClass('negative');
    }

    let finishedReloadingRandom = () => {
      $('#reload')
        .css("width", '0px')
        .css("height", '0px');
    }
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

    resetPos() {
      $(`.${this.selector}`).css(this.animateFrom, `100%`)
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

      <div class="body abs-center"></div>
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
        <div class="heading">
            ${this.title}
        </div>
        <div class="body"></div>
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
      <span id="reload"></span>
      <button class="${this.selector}" style="${this.animateFrom}: 100%">
        ${this.title || ''}
      </button>
    `);
  }
}