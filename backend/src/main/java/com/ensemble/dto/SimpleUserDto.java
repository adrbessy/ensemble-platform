package com.ensemble.dto;

import com.ensemble.model.User;
import lombok.Data;

@Data
public class SimpleUserDto {
    private Long id;
    private String firstName;
    private String lastName;
    private String photoUrl;
    private String photoFilename;


    public SimpleUserDto(User user) {
        this.id = user.getId();
        this.firstName = user.getFirstName();
        this.lastName = user.getLastName();
        this.photoUrl = user.getPhotoUrl();
        this.photoFilename = user.getPhotoFilename();
    }
}
