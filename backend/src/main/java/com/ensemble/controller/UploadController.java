package com.ensemble.controller;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/uploads")
public class UploadController {

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> getFile(@PathVariable String filename) throws MalformedURLException {
        Path filePath = Paths.get(System.getProperty("user.dir"), "uploads", "photos").resolve(filename).normalize();
        System.out.println("📁 Chemin absolu : " + filePath.toAbsolutePath()); // Ajoute cette ligne
        Resource resource = new UrlResource(filePath.toUri());

        if (!resource.exists()) {
            System.out.println("❌ Fichier non trouvé : " + filePath.toAbsolutePath());
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}
