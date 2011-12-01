if (window.cvm === undefined) {
    cvm = {};
}

(function (cvm) {

var parser = cvm.parse.parser;
var expr = cvm.expr;
var select = cvm.select;

var lastKeyDownIsShortcut = false;
var shortcuts = KeyboardShortcuts.instanciate();
var selection;

var Clipboard = Prototype.specialise({
    __init__: function () {
	this.expr = null;
    },
    copy: function (e) {
	this.expr = e;
    },
    paste: function () {
	return this.expr;
    }
});

var clipboard = Clipboard.instanciate();

var keydown = function (e) {
    var sel, s;
    // This is for Firefox
    lastKeyDownIsShortcut = shortcuts.callFromEvent(e);
    if (lastKeyDownIsShortcut) {
	e.preventDefault();
	e.stopPropagation();
	return;
    }
    switch (e.which) {
	case KEY.UP:
	    e.preventDefault();
	    e.stopPropagation();
	    selection.moveUp();
	    break;
	case KEY.DOWN:
	    e.preventDefault();
	    e.stopPropagation();
	    selection.moveDown();
	    break;
	case KEY.LEFT:
	    e.preventDefault();
	    e.stopPropagation();
	    selection.moveLeft();
	    break;
	case KEY.RIGHT:
	    e.preventDefault();
	    e.stopPropagation();
	    selection.moveRight();
	    break;
	case KEY.BACKSPACE: // Backspace
	    e.preventDefault();
	    e.stopPropagation();
	    if (selection.expr) {
		if (!selection.expr.getRoot().editable) {
		    return;
		}
		if (selection.expr.isEditExpr) {
		    s = selection.expr.content;
		    if (s) {
			s = s.substr(0, s.length - 1);
			parser.interpret(selection.expr, s, true);
		    } else {
			var pred = selection.expr.getPredecessor();
			var newParent = selection.remove();
			if (pred.isRoot) {
			    posexprs.remove(pred);
			} else {
			    selection.reset({expr: newParent || pred});
			}
		    }
		} else {
		    sel = expr.editExpr();
		    selection.replace(sel);
		    selection.reset({expr: sel});
		}
		selection.setEditing();
	    }
	    break;
	case KEY.TAB: // Tab
	    e.preventDefault();
	    e.stopPropagation();
	    if (selection.expr && selection.expr.isEditExpr) {
		selection.expr.cycleCompletions();
	    }
	    break;
	default:
	    return;
    }
    select.drawChanged();
};

var keypress = function (e) {
    var c;
    if (!selection.expr || !selection.expr.getRoot().editable) {
	return;
    }
    // XXX check that following cannot be simplified to charCode = e.which;
    var charCode = e.which == 13 ? 13 : e.keyCode; // Used to be e.charCode - changed to e.keyCode for IE8 compatibility
    // This is for Firefox
    if (lastKeyDownIsShortcut) {
	return;
    }
    if (!charCode) {
	return;
    }
    // Input character
    c = String.fromCharCode(charCode);
    if (selection.isSlice) {
	var r = expr.root(selection.expr.fromSlice(selection));
	var e2 = parser.addChar(r.firstChild, c);
	if (e2) {
	    selection.expr.replaceSlice(selection, r.firstChild);
	}
	selection.reset({expr: e2});
    } else if (selection.expr) {
	var newexpr = parser.addChar(selection.expr, c);
	selection.reset({expr: newexpr});
    }
    selection.setEditing();
    select.drawChanged();
};

var copyShortcut = shortcuts.add('C-c', function () {
    selection.copyToClipboard(clipboard);
});
var pasteShortcut = shortcuts.add('C-v', function () {
    selection.pasteFromClipboard(clipboard);
    select.drawChanged();
});
var cutShortcut = shortcuts.add('C-x', function () {
    if (selection.expr) {
	selection.copyToClipboard(clipboard);
    } else {
	return;
    }
    if (!selection.isSlice && selection.expr.parent.isRoot) {
	posexprs.remove(selection.expr.parent);
    } else {
	selection.remove();
    }
    selection.reset();
    select.drawChanged();
});

cvm.edit = {
    init: function (sel) {
	selection = sel;
	$(document).keydown(keydown);
	$(document).keypress(keypress);
	[
	    ["power-button", powerButton],
	    ["subscript-button", subscriptButton],
	    ["sqrt-button", sqrtButton],
	    ["cbrt-button", cbrtButton],
	    ["root-button", rootButton],
	    ["fraction-button", fractionButton]
	].forEach(function (x) {
	    var id = x[0];
	    var btn = x[1];
	    var listener = function (e) {
		if (selection.expr) {
		    btn.action(selection);
		    cvm.select.drawChanged();
		}
	    };
	    $("#"+id).click(listener);
	    $("#hi-" + id).click(listener);
	});

    }
};

})(cvm);
