Feature: Data Item

  Scenario: Creating and modifying a data item
    Given I login and visit the Test Area

    And I create a data item
    Then I should see a "DataItemCover" in the first card
    Then I should see 1 for the single data value

    When I select "viewers" on the "measure" select on the report item
    Then I should see 80 for the single data value
