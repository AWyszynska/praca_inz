<?php
if (!isset($FOOTER_PLUGIN_PART)) $FOOTER_PLUGIN_PART = 'functions';

function sg_footer_is_footer($el) {
    if (is_object($el) && isset($el->isFooter) && (string)$el->isFooter === '1') return true;
    if (is_object($el) && isset($el['isFooter']) && (string)$el['isFooter'] === '1') return true;

    return false;
}

function sg_footer_dock($el) {
    $dock = 'bottom';
    if (is_object($el) && isset($el->footerDock) && (string)$el->footerDock !== '') {
        $dock = (string)$el->footerDock;
    } elseif (is_object($el) && isset($el['footerDock']) && (string)$el['footerDock'] !== '') {
        $dock = (string)$el['footerDock'];
    }

    $dock = strtolower(trim($dock));
    return ($dock === 'top') ? 'top' : 'bottom';
}

function sg_footer_offset($el) {
    if (is_object($el) && isset($el->footerBottom)) return (int)$el->footerBottom;
    if (is_object($el) && isset($el['footerBottom'])) return (int)$el['footerBottom'];
    return 0;
}

function sg_footer_style_prefix($el) {
    $dock = sg_footer_dock($el);
    $off  = sg_footer_offset($el);
    if ($dock === 'top') {
        return "position: fixed; left: 0px; right: 0px; top: {$off}px; ";
    }
    return "position: fixed; left: 0px; right: 0px; bottom: {$off}px; ";
}

function sg_footer_offset_bottom($el) { return sg_footer_offset($el); }
function sg_footer_offset_left($el) { return 0; }
