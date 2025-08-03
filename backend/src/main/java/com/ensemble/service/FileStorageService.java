package com.ensemble.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${app.upload.dir:uploads/photos}")
    private String uploadDir;

    public String storeFile(MultipartFile file) {
        try {
            // Création du dossier s’il n’existe pas
            Path dirPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(dirPath);

            // Génération d’un nom de fichier unique
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf('.'))
                    : "";
            String filename = UUID.randomUUID().toString() + extension;

            // Sauvegarde du fichier
            Path targetPath = dirPath.resolve(filename);
            Files.copy(file.getInputStream(), targetPath);

            return filename;

        } catch (IOException e) {
            throw new RuntimeException("Erreur lors du téléchargement du fichier", e);
        }
    }
}
