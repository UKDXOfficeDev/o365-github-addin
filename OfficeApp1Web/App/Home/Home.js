/// <reference path="../App.js" />

(function () {
    "use strict";

    var github,
        user,
        vm;

    var MainViewModel = function () {
        this.createdText = "Created";
        this.cloneText = "Clone";
        this.descriptionText = "Description";
        this.starsText = "Stars";
        this.watchText = "Watch";
        this.commitCountText = "Commit Count";
        this.contributorText = "Contributor";
        this.repoNameText = "Repo Name";
        this.repoName = ko.observable();
        this.items = ko.observableArray();
        this.selectedRepo = ko.observable();
        this.commits = ko.observableArray();
        this.contributors = ko.observableArray();
        this.userName = ko.observable("peted70");
        this.password = ko.observable();
        this.userData = ko.observable();
        this.createdOn = ko.observable();
        this.cloneUrl = ko.observable();;
        this.description = ko.observable();;
        this.stargazersCount = ko.observable();;
        this.watchersCount = ko.observable();;
        this.userDisplayName = ko.observable();
        this.userLoginHint = ko.observable('Login with your Github username and password to access repository data');
        this.avatarUrl = ko.observable();
        this.showLogin = ko.observable(true);
        this.showMain = ko.observable(false);
        this.showSummary = ko.observable(false);
        this.loading = ko.observable(false);
        this.insertContributors = function () {
            var contributorsTab = new Office.TableData();
            contributorsTab.headers = [this.contributorText, this.commitCountText];
            for (var i = 0; i < this.contributors().length; i++) {
                var item = this.contributors()[i];
                contributorsTab.rows.push([item.loginName, item.commitCount.toString()]);
            }
            Office.context.document.setSelectedDataAsync(contributorsTab,
                { coercionType: "table", asyncContext: this },
                function (result) {
                    if (result.status === Office.AsyncResultStatus.Failed) {
                        app.showNotification("There's a problem!",
                            "unable to add table");
                    }
                });
        };
        this.insertCommits = function () {
            if (Office.context.document.setSelectedDataAsync) {
                var commitsTab = new Office.TableData();
                commitsTab.headers = ["Committer", "Message"];
                for (var i = 0; i < this.commits().length; i++) {
                    var item = this.commits()[i];
                    commitsTab.rows.push([item.committerName, item.commitMessage]);
                }

                Office.context.document.setSelectedDataAsync(commitsTab,
                    { coercionType: "table", asyncContext: this/*, tableOptions: {headerRow:false}*/ },
                    function (result) {
                        if (result.status === Office.AsyncResultStatus.Failed) {
                            app.showNotification("There's a problem!",
                                "unable to add table");
                        } else {
                        }
                    });
            } else {
                app.showNotification('Content insertion not supported');
            }
        };
        this.insertSummary = function () {
            if (Office.context.document.setSelectedDataAsync) {
                var summaryTab = [[this.repoNameText, this.repoName()],
                                  [this.createdText, this.createdOn()],
                                  [this.cloneText, this.cloneUrl()],
                                  [this.descriptionText, this.description()],
                                  [this.starsText, this.stargazersCount().toString()],
                                  [this.watchText, this.watchersCount().toString()]];

                Office.context.document.setSelectedDataAsync(summaryTab,
                    { coercionType: "matrix", asyncContext: this/*, tableOptions: {headerRow:false}*/ },
                    function (result) {
                        if (result.status === Office.AsyncResultStatus.Failed) {
                            app.showNotification("There's a problem!",
                                "unable to add table");
                        } else {
                        }
                    });
            } else {
                app.showNotification('Content insertion not supported');
            }
        };
        this.login = function (formElement) {
            github = new Github({
                username: this.userName(),
                password: this.password(),
                auth: "basic"
            });

            user = github.getUser();
            var that = this;
            user.show(this.userName(), function (err, res) {
                if (err) {
                    app.showNotification('Error:', err.error);
                    return;
                }
                that.showLogin(false);
                that.showMain(true);
                that.userData = res;
                that.userDisplayName(res.name);
                that.userLoginHint(res.name);
                that.avatarUrl(res.avatar_url);
            });
            user.repos(function (err, repos) {
                vm.items(repos);
            });
        };

        this.selectionChanged = function (event, data) {
            this.loading(true);
            this.contributors([]);
            this.commits([]);
            var repo1 = event.selectedRepo();
            if (!repo1) {
                this.loading(false);
                return;
            }

            // populate the repo info...
            var repository = this.selectedRepo();
            var that = this;
            var repo = github.getRepo(this.userName(), repository.name);
            this.createdOn(repository.created_at);
            this.repoName(repository.name);
            this.cloneUrl(repository.clone_url);
            this.description(repository.description);
            this.stargazersCount(repository.stargazers_count);
            this.watchersCount(repository.watchers_count);
            repo.contributors(function (err, data) {
                if (err) {
                    app.showNotification('Error ' + err.error);
                    that.loading(false);
                    return;
                }
                var contributorData = data.map(function (c) {
                    return {
                        avatarUrl: c.author.avatar_url,
                        commitCount: c.total,
                        loginName: c.author.login
                    };
                })
                that.contributors(contributorData);
            });

            repo.getCommits({}, function (err, commits) {
                if (!commits) {
                    app.showNotification('No Commits ' + err.error);
                    that.loading(false);
                    return;
                }

                var commitTexts = commits.map(function (c) {
                    return {
                        commitMessage: c.commit.message,
                        committerName: c.commit.committer.name,
                        committerEmail: c.commit.committer.email,
                        committerDate: c.commit.committer.date
                    };
                });

                that.commits(commitTexts);
                that.showSummary(true);
                that.loading(false);
            });

            /** create a table of commits for each branch */
            repo.listBranches(function (err, branches) {
                //just gives branch names
                repo.getRef('heads/master', function (err, sha) {
                });
            });
        };
    };

    // The initialize function must be run each time a new page is loaded
    Office.initialize = function (reason) {
        $(document).ready(function () {
            vm = new MainViewModel();
            app.initialize();
            ko.applyBindings(vm);
        });
    };

    // Reads data from current document selection and displays a notification
    function getDataFromSelection() {
        Office.context.document.getSelectedDataAsync(Office.CoercionType.Text,
            function (result) {
                if (result.status === Office.AsyncResultStatus.Succeeded) {
                    app.showNotification('The selected text is:', '"' + result.value + '"');
                } else {
                    app.showNotification('Error:', result.error.message);
                }
            }
        );
    }
})();