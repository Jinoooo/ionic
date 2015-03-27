/*
 * Documentation can be found in the $ionicFilterBar service rather than directive
 */
IonicModule
  .directive('ionFilterBar', [
    '$document',
    '$timeout',
    '$ionicGesture',
    '$ionicPlatform',
    '$ionicConfig',
    function ($document, $timeout, $ionicGesture, $ionicPlatform, $ionicConfig) {
      var filterConfig = $ionicConfig.filterBar;
      var hasBackdrop = filterConfig.backdrop();
      var clearIcon = filterConfig.clear();
      var transition = filterConfig.transition();
      var theme = filterConfig.theme();
      var filterBarTemplate;

      //create platform specific filterBar template using filterConfig items
      if ($ionicPlatform.is('android')) {
        filterBarTemplate =
          '<div class="filter-bar-wrapper filter-bar-' + theme + ' filter-bar-transition-'+ transition +'">' +
            '<div class="bar bar-header bar-' + theme + ' item-input-inset">' +
              '<button class="filter-bar-cancel button button-icon icon ' + $ionicConfig.backButton.icon() + '"></button>' +
              '<label class="item-input-wrapper">' +
                '<input type="search" class="filter-bar-search" ng-model="filterText" placeholder="Search" />' +
                '<button style="display:none;" class="filter-bar-clear button button-icon icon ' + clearIcon + '"></button>' +
              '</label>' +
            '</div>' +
          '</div>';
      } else {
        filterBarTemplate =
          '<div class="filter-bar-wrapper filter-bar-' + theme + ' filter-bar-transition-'+ transition +'">' +
            '<div class="bar bar-header bar-' + theme + ' item-input-inset">' +
              '<label class="item-input-wrapper">' +
                '<i class="icon ' + filterConfig.search() + ' placeholder-icon"></i>' +
                '<input type="search" class="filter-bar-search" ng-model="filterText" placeholder="Search"/>' +
                '<button style="display:none;" class="filter-bar-clear button button-icon icon ' + clearIcon + '"></button>' +
              '</label>' +
              '<button class="filter-bar-cancel button button-clear" ng-bind-html="::cancelText"></button>' +
            '</div>' +
          '</div>';
      }

      if (hasBackdrop) {
        filterBarTemplate += '<div class="filter-bar-backdrop"></div>';
      }

      return {
        restrict: 'E',
        scope: true,
        link: function link($scope, $element) {
          var backdrop = $element.children().eq(1);
          var clearEl = jqLite($element[0].querySelector('.filter-bar-clear'));
          var cancelEl = jqLite($element[0].querySelector('.filter-bar-cancel'));
          var inputEl = $element.find('input');
          var filterTextTimeout;
          var swipeGesture;

          $scope.filterText = '';

          // No need to hide/show clear button via ng-show since we can easily do this with jqLite.  inline is fastest
          var showClearButton = function () {
            if(clearEl.css('display') === 'none') {
              clearEl.css('display', 'block');
            }
          };
          var hideClearButton = function () {
            if(clearEl.css('display') === 'block') {
              clearEl.css('display', 'none');
            }
          };

          // When clear button is clicked, clear filterText, hide clear button, show backdrop, and focus the input
          var clearClick = function () {
            $scope.filterText = '';
            hideClearButton();
            $scope.showBackdrop(true);
            $scope.focusInput();
          };

          // Since we are wrapping with label, need to bind touchstart rather than click.
          // Even if we use div instead of label need to bind touchstart.  Click isn't allowing input to regain focus quickly
          clearEl.bind('touchstart mousedown', clearClick);

          // Bind touchstart so we can regain focus of input even while scrolling
          inputEl.bind('touchstart mousedown', function () {
            $scope.focusInput();
          });

          // Action when filter bar is cancelled via backdrop click/swipe or cancel/back buton click.
          // Invokes cancel function defined in filterBar service
          var cancelFilterBar = function () {
            $scope.cancelFilterBar();
          };

          cancelEl.bind('click', cancelFilterBar);

          // When a non escape key is pressed, show/hide backdrop/clear button based on filterText length
          var keyUp = function(e) {
            if (e.which == 27) {
              cancelFilterBar();
            } else if ($scope.filterText && $scope.filterText.length) {
              showClearButton();
              $scope.hideBackdrop(true);
            } else {
              hideClearButton();
              $scope.showBackdrop(true);
            }
          };

          $document.bind('keyup', keyUp);

          var backdropClick = function(e) {
            if (e.target == backdrop[0]) {
              cancelFilterBar();
            }
          };
          // Remove filterBar when backdrop is swiped or clicked if applicable
          if (hasBackdrop) {
            backdrop.bind('click', backdropClick);
            swipeGesture = $ionicGesture.on('swipe', backdropClick, backdrop);
          }

          // Calls the services filterItems function with the filterText to filter items
          var filterItems = function () {
            $scope.filterItems($scope.filterText);
          };

          // Clean up when scope is destroyed
          $scope.$on('$destroy', function() {
            $element.remove();
            $document.unbind('keyup', keyUp);
            $ionicGesture.off(swipeGesture, 'swipe', backdropClick);
          });

          // Watch for changes on filterText and call filterItems when filterText has changed.
          // If debounce is enabled, filter items by the specified or default delay.
          // Prefer timeout debounce over ng-model-options so if filterText is cleared, initial items show up right away with no delay
          $scope.$watch('filterText', function (newFilterText, oldFilterText) {
            var delay;

            if (filterTextTimeout) {
              $timeout.cancel(filterTextTimeout);
            }

            if (newFilterText !== oldFilterText) {
              delay = (newFilterText.length && $scope.debounce) ? $scope.delay : 0;
              filterTextTimeout = $timeout(filterItems, delay, false);
            }
          });
        },
        template: filterBarTemplate
      };
  }]);
