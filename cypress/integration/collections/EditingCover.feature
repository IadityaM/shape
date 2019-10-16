Feature: Editing Cover
  Scenario: Opening the CardCoverEditor to edit the title and subtitle
    Given I login and visit My Collection
    When I click the "CardAction-edit cover"
    Then I should see a 'EditCoverOptions'

    When I type "Title" in the title textarea
    And I type "Subtitle" in the subtitle textarea
    And I click the 'EditCoverCloseBtn'
    And I wait for "@apiUpdateCollection" to finish
    Then I should see a collection card title "Title" with a subtitle "Subtitle"

    When I click the "CardAction-edit cover"
    Then I should see a 'EditCoverOptions'
    And I click the ".MuiSwitchBase-input"
    And I click the 'EditCoverCloseBtn'
    Then I should not see a collection card with subtitle "Subtitle"