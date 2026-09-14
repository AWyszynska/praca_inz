<?php
require_once __DIR__ . '/../db.php';
if (realpath($_SERVER['SCRIPT_FILENAME']) === realpath(__FILE__)) {
    header('Content-Type: application/xml; charset=utf-8');
}

function setNodeText(DOMElement $node, string $value): void {
    while ($node->firstChild) {
        $node->removeChild($node->firstChild);
    }
    $node->appendChild($node->ownerDocument->createTextNode($value));
}

function setFirstTagText(DOMDocument $doc, string $tag, string $value): void {
    $nodes = $doc->getElementsByTagName($tag);
    if ($nodes->length > 0 && $nodes->item(0) instanceof DOMElement) {
        setNodeText($nodes->item(0), $value);
    }
}

function setDirectChildText(DOMElement $parent, string $tag, string $value): void {
    foreach ($parent->childNodes as $child) {
        if ($child instanceof DOMElement && $child->tagName === $tag) {
            setNodeText($child, $value);
            return;
        }
    }

    $new = $parent->ownerDocument->createElement($tag);
    $new->appendChild($parent->ownerDocument->createTextNode($value));
    $parent->appendChild($new);
}

function findElementById(DOMNode $node, string $id): ?DOMElement {
    if ($node instanceof DOMElement && $node->getAttribute('id') === $id) {
        return $node;
    }

    foreach ($node->childNodes as $child) {
        $found = findElementById($child, $id);
        if ($found) {
            return $found;
        }
    }

    return null;
}

function replaceTplIds(DOMNode $node, string $suffix): void {
    if ($node instanceof DOMElement && $node->hasAttribute('id')) {
        $node->setAttribute('id', str_replace('_tpl', '_' . $suffix, $node->getAttribute('id')));
    }

    foreach ($node->childNodes as $child) {
        replaceTplIds($child, $suffix);
    }
}

function setContentByTemplateId(DOMElement $scope, string $templateId, string $suffix, string $value): void {
    $realId = str_replace('_tpl', '_' . $suffix, $templateId);
    $el = findElementById($scope, $realId);

    if ($el) {
        setDirectChildText($el, 'content', $value);
    }
}
function setTagByTemplateId(DOMElement $scope, string $templateId, string $suffix, string $tag, string $value): void {
    $realId = str_replace('_tpl', '_' . $suffix, $templateId);
    $el = findElementById($scope, $realId);

    if ($el) {
        setDirectChildText($el, $tag, $value);
    }
}
function shortText(string $text, int $limit = 120): string {
    $text = trim($text);

    if (mb_strlen($text) <= $limit) {
        return $text;
    }

    return mb_substr($text, 0, $limit) . '…';
}

try {
    $stmt = $pdo->prepare("
        SELECT 
            e.id,
            e.first_name,
            e.last_name,
            e.role,
            e.email,
            e.phone,
            e.hire_date,
            info.file_name,
            info.alt_text,
            info.description
        FROM dbo.employee AS e
        LEFT JOIN dbo.employee_info AS info
            ON info.employee_id = e.id
        WHERE e.is_active = 1
          AND e.role = :role
        ORDER BY e.last_name, e.first_name
    ");

    $stmt->execute([':role' => 'doctor']);
    $vets = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    $vets = [];
}

$templatePath = __DIR__ . '/veterynarze_home.xml';

$doc = new DOMDocument('1.0', 'UTF-8');
$doc->preserveWhiteSpace = false;
$doc->formatOutput = true;

if (!$doc->load($templatePath)) {
    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<customPage><pageHeight>900</pageHeight><element id="err" type="text"><x>20</x><y>20</y><w>900px</w><h>40px</h><content>Nie można wczytać szablonu veterynarze_home.xml</content></element></customPage>';
    exit;
}

$templateBlock = findElementById($doc, 'vet_card_tpl');

if (!$templateBlock) {
    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<customPage><pageHeight>900</pageHeight><element id="err" type="text"><x>20</x><y>20</y><w>900px</w><h>40px</h><content>Brak elementu vet_card_tpl w szablonie XML</content></element></customPage>';
    exit;
}

$parent = $templateBlock->parentNode;
$parent->removeChild($templateBlock);

setFirstTagText($doc, 'generatedAt', date('Y-m-d H:i:s'));

$pageHeight = max(1900, 251 + count($vets) * 500 + 520);
setFirstTagText($doc, 'pageHeight', (string)$pageHeight);

foreach ($vets as $i => $vet) {
    $id = (string)((int)$vet['id']);
    $blockY = 251 + ($i * 500);

    $clone = $templateBlock->cloneNode(true);

    if (!$clone instanceof DOMElement) {
        continue;
    }

    replaceTplIds($clone, $id);

    setDirectChildText($clone, 'y', (string)$blockY);

    $firstName = trim((string)($vet['first_name'] ?? ''));
    $lastName = trim((string)($vet['last_name'] ?? ''));
    $fullName = trim($firstName . ' ' . $lastName);

    $description = trim((string)($vet['description'] ?? ''));
    if ($description === '') {
        $description = 'Lekarz weterynarii - opieka ogólna.';
    }

    $shortDescription = shortText($description, 120);

    $hireYear = '';
    if (!empty($vet['hire_date'])) {
        try {
            $hireYear = (new DateTime($vet['hire_date']))->format('Y');
        } catch (Throwable $e) {
            $hireYear = '';
        }
    }

    $phone = trim((string)($vet['phone'] ?? ''));
    $email = trim((string)($vet['email'] ?? ''));

    $meta = '';
    if ($hireYear !== '') {
        $meta .= 'W VetMell od: ' . $hireYear . "\n";
    }
    if ($phone !== '') {
        $meta .= 'Telefon: ' . $phone . "\n";
    }
    if ($email !== '') {
        $meta .= 'E-mail: ' . $email;
    }

    if (!empty($vet['file_name'])) {
        // Jeżeli folder photo masz w C:\xampp\htdocs\praca_inz\photo,
        // to w final_view.php ścieżka powinna być taka:
        $photoPath = 'projects\photo/' . basename((string)$vet['file_name']);
    } else {
        $photoPath = 'photo/vet_placeholder.png';
    }

    setContentByTemplateId($clone, 'vet_name_tpl', $id, $fullName);
    setContentByTemplateId($clone, 'vet_short_tpl', $id, $shortDescription);
    setContentByTemplateId($clone, 'vet_meta_tpl', $id, $meta);
    setContentByTemplateId($clone, 'vet_photo_small_tpl', $id, $photoPath);
    setContentByTemplateId($clone, 'vet_photo_big_tpl', $id, $photoPath);
    setContentByTemplateId($clone, 'vet_full_desc_tpl', $id, $description);
setTagByTemplateId($clone, 'vet_btn_tpl', $id, 'htmlId', 'sgbtn_vet_' . $id);
setTagByTemplateId($clone, 'vet_btn_tpl', $id, 'htmlClass', 'sgbtn-wrap vet-more-btn');
setTagByTemplateId($clone, 'vet_btn_tpl', $id, 'btnAction', 'none');
    $parent->appendChild($clone);
}

echo $doc->saveXML();