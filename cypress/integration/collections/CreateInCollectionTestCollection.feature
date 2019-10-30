Feature: Creating an "in-collection" Test Collection

  Scenario: Adding and launching an in-collection test
    Given I login and visit the Test Area
    When I create a test collection named "Cypress Test"
    Then I should see a collection card named "Cypress Test"
    When I navigate to the collection named "Cypress Test" via the "CollectionCover"
    Then I should see "Cypress Test" in a "EditableNameHeading"
    When I click the "Radio-collection"
    And I wait for "@apiUpdateCollection" to finish
    And I wait for "@apiGetCollectionCards" to finish
    # verify existence of all three sections
    Then I should see "intro" in a "section-title"
    Then I should see "Idea(s)" in a "section-title"
    Then I should see "outro" in a "section-title"
    Then I should see 1 "QuestionSelectOption-useful"
    Then I should see "Useful" in a "QuestionSelectOption-useful"
    Then I should see "End of Survey" in a ".DisplayText"
    When I enter "solutions{enter}" as my category
    And I fill the 1st "DescriptionQuestionText" with "What do you think?"
    And I fill the 2nd "DescriptionQuestionText" with "Would you buy it?"
    And I wait for "@apiUpdateItem" to finish

    # Launch the test
    When I click the "LaunchFormButton" containing "Get Feedback"
    And I wait for "@apiLaunchTest" to finish
    Then I should see "Category Satisfaction" in a "DataItemCover"
    Then I should see "Clarity" in a "DataItemCover"
    Then I should see "Excitement" in a "DataItemCover"
    Then I should see "Usefulness" in a "DataItemCover"
    Then I should see "Cypress Test" in a "LegendItemCover"

    # assuming the collection cover is not truncated...
    Then I should see a collection card named "Cypress Test Feedback Design"
    Then I should see "Get Link" in a "HeaderFormButton"
    Then I should see "Stop Feedback" in a "HeaderFormButton"

    When I navigate to the collection named "Cypress Test Feedback Design" via the "CollectionCover"

    # NOTE: seemingly no way to test clipboard copying in cypress (i.e. "Get Link")
    # this is used in the "visit current Test URL" below
    When I capture the current URL
    And I visit the current Test URL
    And I wait for "@apiGetCollection" to finish
    And I wait for "@apiGetTestCollection" to finish
    And I wait for 1 second
    Then I should see a "ActivityLogSurveyResponder"
