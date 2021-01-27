angular.module("app", ["templates"])
  .service('DataService', ["$rootScope", ($rootScope) => {
    //Объявляем хранилище массива
    let storage = makeDefaultData()

    const getStorage = () => {
      return storage;
    }

    const addItemToStorage = (item) => {
      storage.push(item);
      $rootScope.$broadcast('updateLastItemName')
    }

    const addTagToStorage = (itemID, tag) => {
      const addTag = storage.find(
        item => item.id === itemID)
      addTag.tags.includes(tag)
        ? console.error('This tag already exists')
        : addTag.tags.push(tag)
      $rootScope.$broadcast('updateUniqueTags')
    }

    const removeTagFromStorage = (itemID, tag) => {
      const findItemByID = storage.find(item => item.id === itemID)
      const getTagIndex = findItemByID
        .tags.findIndex(oldTag => oldTag === tag)
      const removeTag = findItemByID
        .tags.splice(getTagIndex, 1)
      $rootScope.$broadcast('removeTag-event', storage)
      $rootScope.$broadcast('updateUniqueTags')
    }

    const getLastItemName = () => {
      const copyStore = [...storage]
      copyStore.sort((a, b) => a.date > b.date ? 1 : -1)
      return copyStore[copyStore.length - 1].title
    }

    const getUniqueTags = () => {
      const flatArr = storage.flatMap(item => item.tags)
      return [...new Set(flatArr)]
    }

    return {
      getStorage: getStorage,
      addItem: addItemToStorage,
      addTag: addTagToStorage,
      removeTag: removeTagFromStorage,
      getTags: getUniqueTags,
      lastItem: getLastItemName
    }
  }])
  .directive("app", () => {
    return {
      scope: {},
      restrict: "E",
      templateUrl: "./js/app/app.tpl.html",
      controller: ["$scope", appCtrl]
    };

    function appCtrl($scope) {
      //Вызывает эвент передачи выбранного предмета в дочернем контроллере Sidebar
      $scope.$on('item-toApp-event', (e, item) => {
          $scope.sendDataToSidebar(item)
        }
      );
      $scope.sendDataToSidebar = (item) => {
        $scope.$broadcast('item-toSidebar-event', item)
      };

    }
  })
  .directive("contentView", () => {
    return {
      scope: {},
      restrict: "E",
      templateUrl: "./js/app/content-view.tpl.html",
      controller: ["$scope", "$element", "DataService", contentViewCtrl]
    };

    function contentViewCtrl($scope, $element, DataService) {
      $scope.model = {
        dataArr: [],
        filteredArr: [],
        selectedFilter: 'byTitle',
        searchField: '',
        newItemName: '',
        selectedItem: null,
        dateTime: 'dd.MM.yy HH:mm',
        dateOnly: false
      };
      $scope.model.dataArr = DataService.getStorage();
      $scope.model.filteredArr = $scope.model.dataArr

      $scope.sortByOption = () => {
        const filterArr = $scope.model.filteredArr
        const selectedFilter = $scope.model.selectedFilter
        if (filterArr.length > 0) {
          if (selectedFilter === 'byTitle') {
            filterArr.sort(
              (a, b) =>
                a.title > b.title ? 1 : -1
            )
          } else if (selectedFilter === 'byDate') {
            filterArr.sort(
              (a, b) =>
                a.date > b.date ? -1 : 1
            )
          }
          $scope.model.filteredArr = filterArr
        }
      };

      //Поиск по строке Search
      $scope.filterDataBySearch = () => {
        const searchField = $scope.model.searchField
        const arr = $scope.model.dataArr
        const filterArr = arr.filter(
          item => item.title.toLowerCase()
            .includes(searchField.toLowerCase()))
        $scope.model.filteredArr = filterArr
      };
      //Переключение отображения только даты/даты и времени
      $scope.enableOnlyDate = () => {
        const dateOnly = $scope.model.dateOnly
        let dateTimeView
        dateOnly ? dateTimeView = 'dd.MM.yy' : dateTimeView = 'dd.MM.yy HH:mm'
        $scope.model.dateTime = dateTimeView
      };

      $scope.addItem = () => {
        const array = $scope.model.dataArr
        const item = {
          id: makeDataId(),
          title: $scope.model.newItemName,
          tags: [],
          date: new Date(Date.now())
        }
        //Проверяет наличие такого же объекта по полю title
        const validator = array.find(
          obj => obj.title.toLowerCase() === item.title.toLowerCase())
        if (validator) {
          console.error('Item with this name already exists')
        } else {
          DataService.addItem(item)
          $scope.model.filteredArr = $scope.model.dataArr
        }
      };
      //Выделяет активным предмет, передаёт эмит в контроллер App
      $scope.sendItemEvent = (item, index) => {
        $scope.model.selectedItem = index
        $scope.$emit('item-toApp-event', item)
      };

      $scope.$on('removeTag-event', (e, arr) => {
        $scope.model.dataArr = arr
        $scope.model.filteredArr = $scope.model.dataArr
        $scope.sendArrEvent($scope.model.filteredArr)
      })
    };
  })
  .directive("sidebarView", () => {
    return {
      scope: {},
      restrict: "E",
      templateUrl: "./js/app/sidebar-view.tpl.html",
      controller: ["$scope", "$element", "DataService", sidebarViewCtrl]
    };

    function sidebarViewCtrl($scope, $element, DataService) {
      $scope.model = {
        item: {},
        newTag: ''
      };

      $scope.$on('item-toSidebar-event', (e, item) => {
        $scope.model.item = item
      });

      $scope.addTag = (itemID, tag) => {
        if (itemID !== undefined && tag !== '') {
          DataService.addTag(itemID, tag)
        } else {
          console.error('No item was chosen or new tag field is null')
        }
      };

      $scope.removeTag = (itemID, tag) => {
        DataService.removeTag(itemID, tag)
      };
    };
  })
  .directive("elementsView", () => {
    return {
      scope: {},
      restrict: "E",
      templateUrl: "./js/app/elements-view.tpl.html",
      controller: ["$scope", "$element", elementsViewCtrl],
    };

    function elementsViewCtrl($scope, $element) {
      $scope.model = {
        width: 300,
      };

      $scope.setWidth = () => {
        let width = $scope.model.width;
        if (!width) {
          width = 1;
          $scope.model.width = width;
        }
        $element.css("width", `${width}px`);
      };
      $scope.setWidth();

    }
  })
  .directive("summaryView", () => {
    return {
      scope: {},
      restrict: "E",
      templateUrl: "./js/app/summary-view.tpl.html",
      controller: ["$scope", "$element", "DataService", summaryViewCtrl]
    };

    function summaryViewCtrl($scope, $element, DataService) {
      $scope.model = {
        lastItemName: '',
        tagList: []
      };
      $scope.model.lastItemName = DataService.lastItem()
      $scope.model.tagList = DataService.getTags()

      $scope.$on('updateLastItemName', () => {
        $scope.getName()
      })

      $scope.$on('updateUniqueTags', () => {
        $scope.getUniqueTags()
      })

      $scope.getName = () => {
        $scope.model.lastItemName = DataService.lastItem()
      }

      $scope.getUniqueTags = () => {
        $scope.model.tagList = DataService.getTags()
      };
    }
  });

