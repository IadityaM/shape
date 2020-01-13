import _ from 'lodash'

export const groupByConsecutive = (array, value) => {
  const groups = []
  let buffer = []
  for (let i = 0; i < array.length; i += 1) {
    const curItem = array[i]
    if (curItem === value) {
      buffer.push(i)
    } else if (buffer.length > 0) {
      groups.push(buffer)
      buffer = []
    }
  }
  if (buffer.length > 0) groups.push(buffer)
  return groups
}

export const findTopLeftCard = cards => {
  const minRow = _.minBy(cards, 'row').row
  const minRowCards = _.filter(cards, { row: minRow })
  return _.minBy(minRowCards, 'col')
}

// calculate row/col of these cards as if they were in a 4-column grid sequentially
export const calculateRowsCols = cards => {
  let row = 0
  const matrix = []
  const cols = 4
  // create an empty row
  matrix.push(_.fill(Array(cols), null))
  const sortedCards = _.sortBy(cards, 'order')

  _.each(sortedCards, (card, i) => {
    let filled = false
    while (!filled) {
      const { width, height } = card
      // go through the row and see if there is an empty gap that fits cardWidth
      const gaps = groupByConsecutive(matrix[row], null)
      const maxGap = _.find(gaps, g => g.length >= width) || {
        length: 0,
      }

      if (maxGap && maxGap.length) {
        const [nextX] = maxGap
        filled = true
        const position = {
          x: nextX,
          y: row,
        }
        card.position = position

        // fill rows and columns
        _.fill(matrix[row], card.id, position.x, position.x + width)
        for (let y = 1; y < height; y += 1) {
          if (!matrix[row + y]) matrix.push(_.fill(Array(cols), null))
          _.fill(matrix[row + y], card.id, position.x, position.x + width)
        }

        if (_.last(matrix[row]) === card.id) {
          row += 1
          if (!matrix[row]) matrix.push(_.fill(Array(cols), null))
        }
      } else {
        row += 1
        if (!matrix[row]) matrix.push(_.fill(Array(cols), null))
      }
    }
  })
  return sortedCards
}

export const findClosestOpenSpot = (placeholder, openSpotMatrix) => {
  const { row, col, height, width } = placeholder

  let possibilities = []
  let exactFit = false

  _.each(openSpotMatrix, (rowVals, rowIdx) => {
    if (rowIdx >= row && rowIdx <= row + 15) {
      _.each(rowVals, (openSpots, colIdx) => {
        let canFit = false
        if (openSpots >= width) {
          if (height > 1) {
            _.times(height - 1, i => {
              const nextRow = openSpotMatrix[rowIdx + i + 1]
              if (nextRow && nextRow[colIdx] && nextRow[colIdx] >= width) {
                canFit = true
              }
            })
          } else {
            canFit = true
          }
        }

        if (canFit) {
          const rowDiff = rowIdx - row
          let colDiff = colIdx - col
          // pythagorean distance + weighted towards the right
          if (colDiff < 0) {
            colDiff *= 1.01
          } else {
            colDiff *= 0.99
          }
          const distance = Math.sqrt(rowDiff * rowDiff + colDiff * colDiff)
          exactFit = distance === 0
          possibilities.push({ row: rowIdx, col: colIdx, distance })
        }
        if (exactFit || possibilities.length > 32) {
          // exit loop
          return false
        }
      })
    }
    if (exactFit || possibilities.length > 32) {
      // exit loop
      return false
    }
  })

  possibilities = _.sortBy(possibilities, 'distance')
  const closest = possibilities[0]
  return closest || false
}

const matrixWithDraggedSpots = (collection, dragGridSpot) => {
  const cardMatrix = [...collection.cardMatrix]

  const draggingPlaceholders = [...dragGridSpot.values()]
  _.each(draggingPlaceholders, placeholder => {
    const maxRow = placeholder.row + placeholder.height
    const maxCol = placeholder.col + placeholder.width
    const rows = _.range(placeholder.row, maxRow)
    const cols = _.range(placeholder.col, maxCol)

    // Iterate over each to populate the matrix
    _.each(rows, row => {
      _.each(cols, col => {
        cardMatrix[row][col] = placeholder
      })
    })
  })

  return cardMatrix
}

/*
 * The drag matrix is an array of arrays (like the cardMatrix) that simply represents
 * the number of open spots to the right of any particular coordinate (row/col)
 * e.g.
 * [2, 1, 0, 0, 5...]
 * [10, 9, 8, 7, 6...]
 */
export const calculateOpenSpotMatrix = ({
  collection,
  multiMoveCardIds,
  dragGridSpot,
  withDraggedSpots = false,
} = {}) => {
  const cardMatrix = withDraggedSpots
    ? matrixWithDraggedSpots(collection, dragGridSpot)
    : collection.cardMatrix
  const openSpotMatrix = [[]]

  _.each(cardMatrix, (row, rowIdx) => {
    let open = 0
    openSpotMatrix[rowIdx] = Array(16)
    const reversed = _.reverse(row)
    _.each(reversed, (card, colIdx) => {
      if (card && !_.includes(multiMoveCardIds, card.id)) {
        open = 0
      } else {
        open += 1
      }
      openSpotMatrix[rowIdx][15 - colIdx] = open
    })
  })

  return openSpotMatrix
}
