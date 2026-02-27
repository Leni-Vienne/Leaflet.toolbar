// L.Layer was introduced in Leaflet 1.0 and is not present in earlier releases.
window.L.Toolbar2 = (L.Layer || L.Class).extend({
	statics: {
		baseClass: 'leaflet-toolbar'
	},

	options: {
		className: '',
		filter: function() { return true; },
		actions: []
	},

	initialize: function(options) {
		L.setOptions(this, options);
		this._toolbar_type = this.constructor._toolbar_class_id;
	},

	addTo: function(map) {
		this._arguments = [].slice.call(arguments);

		map.addLayer(this);

		return this;
	},

	onAdd: function(map) {
		var currentToolbar = map._toolbars[this._toolbar_type];

		if (this._calculateDepth() === 0) {
			if (currentToolbar) { map.removeLayer(currentToolbar); }
			map._toolbars[this._toolbar_type] = this;
		}
	},

	onRemove: function(map) {
		var i, l, action;

		// Clean up _ul event listeners (fixes memory leak: detached event listeners)
		if (this._ul && this._disabledEvents) {
			for (i = 0, l = this._disabledEvents.length; i < l; i++) {
				L.DomEvent.off(this._ul, this._disabledEvents[i], L.DomEvent.stopPropagation);
			}
		}

		// Clean up action icon listeners and sub-toolbars
		if (this._actionInstances) {
			for (i = 0, l = this._actionInstances.length; i < l; i++) {
				action = this._actionInstances[i];
				if (action && action._link) {
					L.DomEvent.off(action._link, 'click', action.enable, action);
				}
				if (action && action.destroy) { action.destroy(); }
			}
			this._actionInstances = null;
		}

		if (this._calculateDepth() === 0) {
			delete map._toolbars[this._toolbar_type];
		}
	},

	appendToContainer: function(container) {
		var baseClass = this.constructor.baseClass + '-' + this._calculateDepth(),
			className = baseClass + ' ' + this.options.className,
			Action, action,
			i, j, l, m;

		// Clean up previous _ul listeners before overwriting (happens with singleton sub-toolbars)
		if (this._ul && this._disabledEvents) {
			for (j = 0, m = this._disabledEvents.length; j < m; j++) {
				L.DomEvent.off(this._ul, this._disabledEvents[j], L.DomEvent.stopPropagation);
			}
		}

		// Clean up previous action instances before overwriting
		if (this._actionInstances) {
			for (i = 0, l = this._actionInstances.length; i < l; i++) {
				action = this._actionInstances[i];
				if (action && action._link) {
					L.DomEvent.off(action._link, 'click', action.enable, action);
				}
				if (action && action.destroy) { action.destroy(); }
			}
			this._actionInstances = null;
		}

		this._container = container;
		this._ul = L.DomUtil.create('ul', className, container);

		// Ensure that clicks, drags, etc. don't bubble up to the map.
		// These are the map events that the L.Draw.Polyline handler listens for.
		// Note that L.Draw.Polyline listens to 'mouseup', not 'mousedown', but
		// if only 'mouseup' is silenced, then the map gets stuck in a halfway
		// state because it receives a 'mousedown' event and is waiting for the
		// corresponding 'mouseup' event.
		this._disabledEvents = [
			'click', 'mousemove', 'dblclick',
			'mousedown', 'mouseup', 'touchstart'
		];

		for (j = 0, m = this._disabledEvents.length; j < m; j++) {
			L.DomEvent.on(this._ul, this._disabledEvents[j], L.DomEvent.stopPropagation);
		}

		/* Instantiate each toolbar action and add its corresponding toolbar icon. */
		this._actionInstances = [];
		for (i = 0, l = this.options.actions.length; i < l; i++) {
			Action = this._getActionConstructor(this.options.actions[i]);

			action = new Action();
			action._createIcon(this, this._ul, this._arguments);
			this._actionInstances.push(action);
		}
	},

	_getActionConstructor: function(Action) {
		var args = this._arguments,
			toolbar = this;

		return Action.extend({
			initialize: function() {
				Action.prototype.initialize.apply(this, args);
			},
			enable: function(e) {
				/* Ensure that only one action in a toolbar will be active at a time. */
				if (toolbar._active) { toolbar._active.disable(); }
				toolbar._active = this;

				Action.prototype.enable.call(this, e);
			}
		});
	},

	/* Used to hide subToolbars without removing them from the map. */
	_hide: function() {
		this._ul.style.display = 'none';
	},

	/* Used to show subToolbars without removing them from the map. */
	_show: function() {
		this._ul.style.display = 'block';
	},

	_calculateDepth: function() {
		var depth = 0,
			toolbar = this.parentToolbar;

		while (toolbar) {
			depth += 1;
			toolbar = toolbar.parentToolbar;
		}

		return depth;
	}
});

// L.Mixin.Events is replaced by L.Evented in Leaflet 1.0. L.Layer (also
// introduced in Leaflet 1.0) inherits from L.Evented, so if L.Layer is
// present, then L.Toolbar2 will already support events.
if (!L.Evented) {
    L.Toolbar2.include(L.Mixin.Events);
}

L.toolbar = {};

var toolbar_class_id = 0;

L.Toolbar2.extend = function extend(props) {
	var statics = L.extend({}, props.statics, {
		"_toolbar_class_id": toolbar_class_id
	});

	toolbar_class_id += 1;
	L.extend(props, { statics: statics });

	return L.Class.extend.call(this, props);
};

L.Map.addInitHook(function() {
	this._toolbars = {};
});
