# ruby version of CollectionGridCalculator.js
module CollectionGrid
  class Calculator
    def self.group_by_consecutive(array, value)
      groups = []
      buffer = []
      array.count.times do |i|
        cur_item = array[i]
        if cur_item == value
          buffer.push(i)
        elsif buffer.count.positive?
          groups.push(buffer)
          buffer = []
        end
      end
      groups.push(buffer) if buffer.count.positive?
      groups
    end

    def self.top_left_card(cards)
      min_row, min_col = cards.pluck(:row, :col).min
      cards.find { |c| c.row == min_row && c.col == min_col }
    end

    # this will add row/col value to any set of cards, as if they were a 4-col layout
    def self.calculate_rows_cols(cards)
      row = 0
      matrix = []
      cols = 4
      # // create an empty row
      matrix.push(Array.new(cols))

      cards.each do |card|
        # object_id for unpersisted cards
        card_id = card.id || card.object_id
        filled = false
        until filled
          width = card.width
          height = card.height

          # // go through the row and see if there is an empty gap that fits cardWidth
          gaps = group_by_consecutive(matrix[row], nil)
          max_gap = gaps.find { |g| g.count >= width }
          max_gap_length = max_gap ? max_gap.count : 0

          if max_gap && max_gap_length
            filled = true

            col = max_gap.first
            card.col = col
            card.row = row
            # // fill rows and columns
            matrix[row].fill(card_id, col, width)

            (height - 1).times do |h|
              row_idx = row + h + 1
              matrix.push(Array.new(cols)) if matrix[row_idx].blank?
              matrix[row_idx].fill(card_id, col, width)
            end

            if matrix[row].last == card_id
              row += 1
              matrix.push(Array.new(cols)) if matrix[row].blank?
            end
          else
            row += 1
            matrix.push(Array.new(cols)) if matrix[row].blank?
          end
        end
      end
      cards
    end

    def self.card_max_row(card)
      return 0 if card.row.blank? || card.height.blank?

      card.row + card.height - 1
    end

    def self.card_max_col(card)
      return 0 if card.col.blank? || card.width.blank?

      card.col + card.width - 1
    end

    def self.board_matrix(
      collection:,
      drag_positions: {},
      moving_cards: [],
      debug: false
    )
      return [] if collection.collection_cards.none?

      # omit moving cards from our matrix
      cards = collection.collection_cards.where.not(id: moving_cards.pluck(:id))
      if drag_positions.present?
        cards += drag_positions.values
      end

      max_row = cards.map { |card| card_max_row(card) }.max || 0
      matrix = Array.new(max_row + 1) { Array.new(16) }

      cards.each do |card|
        rows = (card.row..card_max_row(card))
        cols = (card.col..card_max_col(card))
        rows.each do |row|
          cols.each do |col|
            matrix[row][col] = card
          end
        end
      end

      if debug
        output = matrix.map do |row|
          row.map { |c| c.nil? ? '' : c.id }
        end
        pp output
      end

      matrix
    end

    def self.determine_drag_map(
      master_card:,
      moving_cards:
    )
      drag_map = moving_cards.map do |card|
        row = card.row
        col = card.col
        master_col = master_card.col
        master_row = master_card.row
        Mashie.new(
          card: card,
          col: col - master_col,
          row: row - master_row,
        )
      end
      drag_map
    end

    def self.exact_open_spot?(
      card:,
      collection:
    )
      open_spot_matrix = calculate_open_spot_matrix(
        collection: collection,
        # ignore the card we're trying to place
        moving_cards: [card],
      )
      open_spot = find_closest_open_spot(
        card,
        open_spot_matrix,
      )
      open_spot && open_spot.row == card.row && open_spot.col == card.col
    end

    def self.place_cards_on_board(
      row:,
      col:,
      collection:,
      from_collection:,
      moving_cards:
    )
      if from_collection.is_a?(Collection::Board)
        master_card = top_left_card(moving_cards)
      else
        # important to do this first to assign row/col onto the cards
        moving_cards = calculate_rows_cols(moving_cards)
        # cards are already ordered
        master_card = moving_cards.first
      end

      master_position = Mashie.new(
        row: row,
        col: col,
        height: master_card.height,
        width: master_card.width,
      )
      drag_map = determine_drag_map(
        master_card: master_card,
        moving_cards: moving_cards,
      )
      open_spot_matrix = calculate_open_spot_matrix(
        collection: collection,
        moving_cards: moving_cards,
      )

      drag_positions = {}
      drag_map.each do |mapped|
        card = mapped.card
        position = Mashie.new(
          row: mapped.row + master_position.row,
          col: mapped.col + master_position.col,
          width: card.width,
          height: card.height,
        )

        open_spot = find_closest_open_spot(
          position,
          open_spot_matrix,
        )
        # not really sure how it couldn't find a spot since it should always find an empty row at the bottom...
        next unless open_spot.present?

        position.row = open_spot.row
        position.col = open_spot.col

        # object_id for unpersisted cards
        card_id = card.id || card.object_id
        # drag_positions tracks what we have "placed" so far
        drag_positions[card_id] = position

        # now actually move the card (to be persisted in wrapping services)
        card.parent_id = collection.id
        card.row = position.row
        card.col = position.col

        open_spot_matrix = calculate_open_spot_matrix(
          collection: collection,
          moving_cards: moving_cards,
          drag_positions: drag_positions,
        )
      end

      moving_cards
    end

    def self.find_closest_open_spot(position, open_spot_matrix)
      row = position.row
      col = position.col
      width = position.width
      height = position.height

      possibilities = []
      exact_fit = false

      if open_spot_matrix[row].blank?
        # if this entire row is empty we know it fits
        return Mashie.new(
          row: row,
          col: col,
        )
      end

      open_spot_matrix.each_with_index do |row_vals, row_idx|
        next unless row_idx >= row && row_idx <= row + 15

        row_vals.each_with_index do |open_spots, col_idx|
          can_fit = false
          if open_spots >= width
            if height > 1
              (height - 1).times do |i|
                next_row = open_spot_matrix[row_idx + i + 1]
                # if next row is blank then that row doesn't exist yet (empty)
                if next_row.blank?
                  can_fit = true
                elsif next_row[col_idx] && next_row[col_idx] >= width
                  can_fit = true
                end
              end
            else
              can_fit = true
            end
          end

          if can_fit
            row_diff = row_idx - row
            col_diff = col_idx - col
            if col_diff.negative?
              col_diff *= 1.01
            else
              col_diff *= 0.99
            end
            distance = Math.sqrt(row_diff * row_diff + col_diff * col_diff)
            exact_fit = distance.zero?
            possibilities.push(
              Mashie.new(
                row: row_idx,
                col: col_idx,
                distance: distance,
              ),
            )
          end
          if exact_fit || possibilities.size > 32
            break
          end
        end
        if exact_fit || possibilities.size > 32
          break
        end
      end
      possibilities = possibilities.sort_by { |p| p[:distance] }
      closest = possibilities.first
      closest || false
    end

    def self.calculate_open_spot_matrix(
      collection:,
      moving_cards: [],
      drag_positions: {}
    )
      card_matrix = board_matrix(
        collection: collection,
        drag_positions: drag_positions,
        moving_cards: moving_cards,
      )
      open_spot_matrix = [[]]

      card_matrix.each_with_index do |row, row_idx|
        open = 0
        open_spot_matrix[row_idx] = Array.new(16)
        reversed = row.reverse

        reversed.each_with_index do |card, col_idx|
          if card.present?
            open = 0
          else
            open += 1
          end
          open_spot_matrix[row_idx][15 - col_idx] = open
        end
      end
      open_spot_matrix
    end

    def self.matrix_with_dragged_spots(
      collection:,
      drag_grid_spot:
    )
      card_matrix = board_matrix(collection: collection)
      dragging_placeholders = drag_grid_spot.values
      dragging_placeholders.each do |placeholder|
        max_row = placeholder.row + placeholder.height
        max_col = placeholder.col + placeholder.width
        rows = (placeholder.row...max_row).to_a
        cols = (placeholder.col...max_col).to_a

        rows.each do |row|
          cols.each do |col|
            card_matrix[row][col] = placeholder
          end
        end
      end
      card_matrix
    end
  end
end
