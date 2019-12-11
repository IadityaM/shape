Feature: Creating a Search Collection

  Scenario: Adding a Search collection via the BCT
    Given I login and visit the Test Area
    When I create a searchCollection collection named "cypress"

    Then I should see a collection card named "cypress"
    When I navigate to the collection named "cypress" via the "CollectionCover"
    Then I should see "cypress" in a "EditableNameHeading"
    Then I should see a collection card named "Cypress Test Area"
    Then I should see the value "cypress" in a "SearchCollectionInput"
    When I click the "SearchCollectionEditTerm"
    When I type " plants" in "SearchCollectionInput"
    Then I should see a "SearchCollectionEmptyMessage"
