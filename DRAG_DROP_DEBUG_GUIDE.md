# Drag & Drop Debugging Guide

## Console Logging Added

Comprehensive logging has been added to help diagnose card drag-and-drop issues. Open your browser's Developer Console (F12) while testing.

## What to Look For

### 1. **DRAG START** 🎯
When you start dragging, you'll see:
```
🎯 DRAG START
  Active ID: <card-id> or <list-id>
  Is List Drag: true/false
  Is Card Drag: true/false
```

**Expected behavior:**
- If dragging a card: `Is Card Drag: true`, `Is List Drag: false`
- If dragging a list: `Is List Drag: true`, `Is Card Drag: false`

**Problem indicators:**
- Both flags are false = Item not recognized
- Both flags are true = Conflict in ID detection

---

### 2. **DRAG OVER** 🔄 (Periodic Sampling)
While dragging, occasional logs show:
```
🔄 DRAG OVER: {
  active: <card-id>,
  over: <target-id> or 'null',
  collisionsCount: 3,
  topCollision: <id>
}
```

**What to check:**
- `over` should update as you move the card over different elements
- `over: null` means no valid drop target detected
- Look for the `__end` suffix when hovering over the bottom of a list

---

### 3. **DRAG END - Main Handler** 🎬
When you drop, you'll see the main dispatcher:
```
🎬 DRAG END - Main Handler
  Active ID: <card-id>
  Over ID: <target-id>
  Is List Drag: false
  Is Card Drag: true
  🎴 Routing to CARD drag handler
```

**Expected flow:**
- Card drag → Routes to CARD handler
- List drag → Routes to LIST handler

**Problem indicators:**
- "Unknown drag type - aborting" = Item not classified correctly
- Wrong handler selected

---

### 4. **CARD DRAG END - Detailed Analysis** 🎴

This is where the magic (or bugs) happen. Key sections:

#### A. List Analysis
```
📊 Analyzing lists and cards:
  List "To Do" (list-id-123): ['Card A', 'Card B']
    ✓ Found SOURCE card in this list
  List "In Progress" (list-id-456): ['Card C', 'Card D']
    ✓ Found TARGET card in this list
```

**What to verify:**
- Source list is correctly identified (where card started)
- Target list is correctly identified (where card was dropped)
- Both lists should show their current cards

#### B. Determined Lists
```
🎯 Determined:
  Source List ID: list-id-123
  Target List ID: list-id-456
```

**Problem indicators:**
- `Source List ID: null` = Card's origin not found
- `Target List ID: null` = Drop target not resolved (will use source list)

#### C. Index Calculations
```
📍 Index Calculations:
  Active Index (in source): 1
  Over Index (in target): 2
  Is Over List Container: false
  Is Over End Target: true
  Calculated New Index: 3
  Source Cards Count: 3
  Target Cards Count: 2
```

**Critical analysis:**
- **Active Index**: Position of dragged card in source list
- **Over Index**: Position in target list where you dropped (-1 if dropped on list container/end)
- **Is Over List Container**: true if dropped on the list itself (not on a card)
- **Is Over End Target**: true if dropped on the `__end` target (bottom of list)
- **Calculated New Index**: Final insertion position

**Common bug patterns:**
- `newIndex` > target list length when dropping mid-list = Wrong calculation
- `Is Over End Target: false` but should be true = End target not detected
- `Over Index: -1` when dropped on a card = Card not in collision detection

#### D. Movement Type
```
🔄 MOVING BETWEEN LISTS
  From: To Do
  To: In Progress
  Moved Card: Card A
  Inserting at index: 2
  New target list order: ['Card C', 'Card D', 'Card A']
```

OR

```
🔃 REORDERING WITHIN SAME LIST
  List: To Do
  Old Index: 1
  New Index (overIndex): 0
  Calculated newIndex: 0
  ✓ Performing reorder
  New order: ['Card B', 'Card A', 'Card C']
```

**What to verify:**
- Card appears in correct position in "New order" array
- For between-lists: Check source list empties correctly
- For same-list: Old and new indices should make sense

---

### 5. **LIST DRAG END** 📋
When dragging list headers:
```
📋 LIST DRAG END
  Active ID: list-id-123
  Over ID: list-id-456
  Is Active a List: true
  Is Over a List: true
  Old Index: 0
  New Index: 2
  New list order: ['List B', 'List C', 'List A']
```

---

## Known Issues to Test

### Issue 1: Card Jumps to Top
**When:** Dragging to middle/bottom of list
**Look for:**
- `Calculated New Index: 0` when it should be higher
- `Is Over End Target: false` when hovering over end
- `Over Index: -1` when dropped on a card

**Cause:** Likely collision detection not picking up the card under pointer

---

### Issue 2: Card Swaps Instead of Inserting
**When:** Dropping between cards
**Look for:**
- `Over Index` pointing to wrong card
- `newIndex` calculation using wrong logic path

**Cause:** `overIndex` might be the card you're hovering, but insertion should happen before it

---

### Issue 3: Empty List Drops Fail
**When:** Dragging to empty list
**Look for:**
- `Target List ID: null` when dropping on empty list
- `Over ID: <list-id>` should match empty list's container
- `Calculated New Index` should be 0

---

### Issue 4: End Target Not Working
**When:** Dragging to bottom drop zone
**Look for:**
- `Over ID` should be `<listId>__end`
- `Is Over End Target: true`
- `Calculated New Index` should equal target list length

**Verify in ListColumn.jsx:**
- End target div has correct ID: `${list._id}__end`
- `useDroppable` is properly registered

---

## Testing Checklist

Test these scenarios and check console logs:

- [ ] Drag card within same list (reorder up)
- [ ] Drag card within same list (reorder down)
- [ ] Drag card to empty list
- [ ] Drag card to top of list with cards
- [ ] Drag card to middle of list with cards
- [ ] Drag card to bottom of list with cards (on end target)
- [ ] Drag list header to reorder lists
- [ ] Ensure list drag doesn't trigger card handler

---

## How to Share Logs

1. Open browser console (F12)
2. Perform the buggy drag operation
3. Copy the entire console output from DRAG START to completion
4. Include:
   - Which operation you tried
   - What you expected
   - What actually happened
   - Full console log output

---

## Code Locations

- **Main handler**: `BoardView.jsx` → `handleDragEnd()`
- **Card logic**: `BoardView.jsx` → `handleCardDragEnd()`
- **List logic**: `BoardView.jsx` → `handleListDragEnd()`
- **Collision detection**: `BoardView.jsx` → `customCollisionDetection()`
- **End target**: `ListColumn.jsx` → `useDroppable({ id: ${list._id}__end })`

---

## Potential Fixes (Based on Log Analysis)

After reviewing logs, common fixes include:

1. **Index calculation** - Adjust `newIndex` logic to handle edge cases
2. **Collision detection** - Switch between `closestCorners`, `closestCenter`, or `pointerWithin`
3. **End target detection** - Ensure `__end` droppable is properly sized/positioned
4. **List container drops** - Handle drops on list container vs. on cards differently
5. **Same-list reorder** - Fix logic when `overIndex === -1`
